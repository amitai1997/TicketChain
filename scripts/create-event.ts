import { ethers } from 'hardhat';
import fs from 'fs';
import path from 'path';
import { EventRegistry } from '../typechain-types';

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

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const nameArg = args.find((arg) => arg.startsWith('--name='));
  const startArg = args.find((arg) => arg.startsWith('--start='));
  const endArg = args.find((arg) => arg.startsWith('--end='));
  const uriArg = args.find((arg) => arg.startsWith('--uri='));

  if (!nameArg || !startArg || !endArg) {
    console.log(
      'Usage: pnpm create-event --name="Event Name" --start="2025-06-01T19:00:00" --end="2025-06-01T23:00:00" [--uri="ipfs://metadata-uri"]'
    );
    return;
  }

  const name = nameArg.split('=')[1].replace(/"/g, '');
  const startDate = new Date(startArg.split('=')[1].replace(/"/g, ''));
  const endDate = new Date(endArg.split('=')[1].replace(/"/g, ''));
  const uri = uriArg
    ? uriArg.split('=')[1].replace(/"/g, '')
    : `ipfs://event-metadata/${encodeURIComponent(name)}`;

  // Convert dates to UNIX timestamps (seconds)
  const startTime = Math.floor(startDate.getTime() / 1000);
  const endTime = Math.floor(endDate.getTime() / 1000);

  // Get the current network
  const network = process.env.HARDHAT_NETWORK || 'localhost';
  console.log(`Creating event on network: ${network}`);

  // Load deployment info
  const deploymentInfo = loadDeploymentInfo(network);
  const eventRegistryAddress = deploymentInfo.eventRegistry;

  console.log(`Using EventRegistry at: ${eventRegistryAddress}`);

  // Connect to the EventRegistry contract
  const [signer] = await ethers.getSigners();
  console.log(`Using signer: ${signer.address}`);

  const eventRegistry = (await ethers.getContractAt(
    'EventRegistry',
    eventRegistryAddress
  )) as EventRegistry;

  console.log(
    `Creating event "${name}" with start: ${startDate.toISOString()} and end: ${endDate.toISOString()}`
  );
  console.log(`Metadata URI: ${uri}`);

  // Create the event
  const tx = await eventRegistry.createEvent(startTime, endTime, uri);

  console.log(`Transaction sent: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`Transaction confirmed in block: ${receipt?.blockNumber}`);

  // Parse event logs to get the event ID
  if (receipt?.logs) {
    const eventCreatedLog = receipt.logs.find(
      (log: any) =>
        log.topics[0] === ethers.id('EventCreated(uint256,address,uint256,uint256,string)')
    );

    if (eventCreatedLog) {
      const eventId = BigInt(eventCreatedLog.topics[1]);
      console.log(`Event created successfully with ID: ${eventId}`);

      // Save event information
      const eventsDir = path.join(__dirname, '../events');
      if (!fs.existsSync(eventsDir)) {
        fs.mkdirSync(eventsDir, { recursive: true });
      }

      const eventInfo = {
        id: eventId.toString(),
        name,
        organizer: signer.address,
        startTime,
        endTime,
        uri,
        network,
        blockNumber: receipt.blockNumber,
        transactionHash: tx.hash,
        timestamp: new Date().toISOString(),
      };

      fs.writeFileSync(
        path.join(eventsDir, `event-${eventId}.json`),
        JSON.stringify(eventInfo, null, 2)
      );

      console.log(`Event information saved to: ${path.join(eventsDir, `event-${eventId}.json`)}`);
    } else {
      console.log('Event created but unable to extract event ID from logs');
    }
  } else {
    console.log('Event created but no logs available');
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
