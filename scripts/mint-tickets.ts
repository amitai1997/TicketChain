import { ethers } from 'hardhat';
import fs from 'fs';
import path from 'path';
import { EventTicket, EventRegistry } from '../typechain-types';

// Helper function to load the deployment info
function loadDeploymentInfo(network: string) {
  const deploymentPath = path.join(__dirname, '../deployments', `${network}-deployment.json`);

  if (!fs.existsSync(deploymentPath)) {
    throw new Error(
      `Deployment file not found for network ${network}. Please deploy contracts first.`
    );
  }

  return JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
}

// Helper function to load event info if available
function loadEventInfo(eventId: string, network: string) {
  const eventPath = path.join(__dirname, '../events', `event-${eventId}.json`);

  if (fs.existsSync(eventPath)) {
    return JSON.parse(fs.readFileSync(eventPath, 'utf-8'));
  }

  return null;
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const eventArg = args.find((arg) => arg.startsWith('--event='));
  const quantityArg = args.find((arg) => arg.startsWith('--quantity='));
  const priceArg = args.find((arg) => arg.startsWith('--price='));
  const transferableArg = args.find((arg) => arg.startsWith('--transferable='));
  const recipientArg = args.find((arg) => arg.startsWith('--recipient='));
  const validFromOffsetArg = args.find((arg) => arg.startsWith('--validFromOffset='));
  const validUntilOffsetArg = args.find((arg) => arg.startsWith('--validUntilOffset='));

  if (!eventArg || !quantityArg || !priceArg) {
    console.log(
      'Usage: pnpm mint-tickets --event=1 --quantity=5 --price="0.1" [--transferable=true] [--recipient=0x...] [--validFromOffset=3600] [--validUntilOffset=7200]'
    );
    return;
  }

  const eventId = eventArg.split('=')[1].replace(/"/g, '');
  const quantity = parseInt(quantityArg.split('=')[1].replace(/"/g, ''), 10);
  const price = ethers.parseEther(priceArg.split('=')[1].replace(/"/g, ''));
  const transferable = transferableArg
    ? transferableArg.split('=')[1].replace(/"/g, '') === 'true'
    : true;

  // Get the current network
  const network = process.env.HARDHAT_NETWORK || 'localhost';
  console.log(`Minting tickets on network: ${network}`);

  // Load deployment info
  const deploymentInfo = loadDeploymentInfo(network);
  const eventRegistryAddress = deploymentInfo.eventRegistry;
  const eventTicketAddress = deploymentInfo.eventTicket;

  console.log(`Using EventRegistry at: ${eventRegistryAddress}`);
  console.log(`Using EventTicket at: ${eventTicketAddress}`);

  // Connect to the contracts
  const [signer] = await ethers.getSigners();
  console.log(`Using signer: ${signer.address}`);

  const eventRegistry = (await ethers.getContractAt(
    'EventRegistry',
    eventRegistryAddress
  )) as EventRegistry;
  const eventTicket = (await ethers.getContractAt(
    'EventTicket',
    eventTicketAddress
  )) as EventTicket;

  // Load event info or fetch from chain
  const eventInfo = loadEventInfo(eventId, network);
  let eventData;

  if (eventInfo) {
    console.log(`Found event info: "${eventInfo.name}" (ID: ${eventInfo.id})`);
    eventData = {
      startTime: eventInfo.startTime,
      endTime: eventInfo.endTime,
    };
  } else {
    console.log(`Fetching event ${eventId} from chain...`);
    try {
      const chainEventData = await eventRegistry.getEventMetadata(eventId);
      eventData = {
        startTime: Number(chainEventData.startTime),
        endTime: Number(chainEventData.endTime),
      };
      console.log(
        `Found event on chain with start: ${new Date(eventData.startTime * 1000).toISOString()} and end: ${new Date(eventData.endTime * 1000).toISOString()}`
      );
    } catch (error) {
      console.error(`Error fetching event ${eventId}:`, error);
      return;
    }
  }

  // Determine ticket validity period
  const validFromOffset = validFromOffsetArg
    ? parseInt(validFromOffsetArg.split('=')[1].replace(/"/g, ''), 10)
    : Math.floor((eventData.endTime - eventData.startTime) * 0.1); // Default 10% after start

  const validUntilOffset = validUntilOffsetArg
    ? parseInt(validUntilOffsetArg.split('=')[1].replace(/"/g, ''), 10)
    : Math.floor((eventData.endTime - eventData.startTime) * 0.1); // Default 10% before end

  const validFrom = eventData.startTime + validFromOffset;
  const validUntil = eventData.endTime - validUntilOffset;

  console.log(
    `Ticket validity period: ${new Date(validFrom * 1000).toISOString()} to ${new Date(validUntil * 1000).toISOString()}`
  );

  // Check if we're minting for specific recipients or batch minting
  if (recipientArg) {
    // Single recipient (potentially multiple tickets)
    const recipient = recipientArg.split('=')[1].replace(/"/g, '');
    console.log(`Minting ${quantity} tickets for recipient: ${recipient}`);

    // Check if we should use batch minting
    if (quantity > 1) {
      const recipients = Array(quantity).fill(recipient);

      console.log(`Batch minting ${quantity} tickets...`);
      const tx = await eventTicket.batchMintTickets(
        recipients,
        eventId,
        price,
        validFrom,
        validUntil,
        transferable
      );

      console.log(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block: ${receipt?.blockNumber}`);
      console.log(`Successfully minted ${quantity} tickets for ${recipient}`);
    } else {
      // Single ticket
      const tx = await eventTicket.mintTicketForEvent(
        recipient,
        eventId,
        price,
        validFrom,
        validUntil,
        transferable
      );

      console.log(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block: ${receipt?.blockNumber}`);

      // Try to find ticket ID from logs
      if (receipt?.logs) {
        const mintLog = receipt.logs.find(
          (log: any) => log.topics[0] === ethers.id('TicketMinted(uint256,uint256,address,uint256)')
        );

        if (mintLog) {
          const ticketId = BigInt(mintLog.topics[1]);
          console.log(`Minted ticket with ID: ${ticketId}`);
        }
      }
    }
  } else {
    // Mint tickets for test accounts
    const signers = await ethers.getSigners();
    const recipients = signers.slice(1, quantity + 1).map((signer) => signer.address);

    if (recipients.length < quantity) {
      console.log(
        `Warning: Only ${recipients.length} test accounts available, minting ${recipients.length} tickets instead of ${quantity}`
      );
    }

    console.log(`Batch minting tickets for ${recipients.length} test recipients...`);
    const tx = await eventTicket.batchMintTickets(
      recipients,
      eventId,
      price,
      validFrom,
      validUntil,
      transferable
    );

    console.log(`Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block: ${receipt?.blockNumber}`);

    // Save ticket information
    const ticketsDir = path.join(__dirname, '../tickets');
    if (!fs.existsSync(ticketsDir)) {
      fs.mkdirSync(ticketsDir, { recursive: true });
    }

    const ticketInfo = {
      event: eventId,
      price: ethers.formatEther(price),
      validFrom: new Date(validFrom * 1000).toISOString(),
      validUntil: new Date(validUntil * 1000).toISOString(),
      transferable,
      network,
      recipients,
      blockNumber: receipt?.blockNumber,
      transactionHash: tx.hash,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(
      path.join(ticketsDir, `tickets-${Date.now()}.json`),
      JSON.stringify(ticketInfo, null, 2)
    );

    console.log(`Successfully minted ${recipients.length} tickets`);
    console.log(
      `Ticket information saved to: ${path.join(ticketsDir, `tickets-${Date.now()}.json`)}`
    );
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
