import { ethers, network } from 'hardhat';
import { setupMinterRole } from './utils/role-setup';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);

  const networkName = network.name;
  console.log(`Network: ${networkName}`);

  // Hardcoded contract address for local testing
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  console.log(`Using contract address: ${contractAddress}`);

  // Setup minter role if not already granted
  await setupMinterRole(contractAddress);

  // Get the contract instance
  const TicketNFT = await ethers.getContractFactory('TicketNFT');
  const ticketNFT = TicketNFT.attach(contractAddress);

  // Get current timestamp
  const currentTime = Math.floor(Date.now() / 1000);

  // Create ticket metadata
  const eventId = 1;
  const price = ethers.parseEther('0.1');
  const validFrom = currentTime + 3600; // 1 hour from now
  const validUntil = currentTime + 86400; // 24 hours from now
  const isTransferable = true;

  // Mint a ticket to the recipient
  console.log('Minting a ticket...');
  const recipientAddress = deployer.address;
  const tokenId = 1;

  try {
    const tx = await ticketNFT.mintTicket(
      recipientAddress, 
      tokenId, 
      eventId, 
      price, 
      validFrom, 
      validUntil, 
      isTransferable
    );

    console.log(`Transaction hash: ${tx.hash}`);
    await tx.wait();

    console.log(`Successfully minted ticket #${tokenId} to ${recipientAddress}`);

    // Verify the ticket metadata
    const metadata = await ticketNFT.getTicketMetadata(tokenId);

    console.log('Ticket Metadata:');
    console.log('===============');
    console.log(`Event ID: ${metadata.eventId}`);
    console.log(`Price: ${ethers.formatEther(metadata.price)} ETH`);
    console.log(`Valid From: ${new Date(Number(metadata.validFrom) * 1000).toLocaleString()}`);
    console.log(`Valid Until: ${new Date(Number(metadata.validUntil) * 1000).toLocaleString()}`);
    console.log(`Transferable: ${metadata.isTransferable}`);
  } catch (error) {
    console.error('Error minting ticket:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
