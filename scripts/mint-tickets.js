// Simple script to mint tickets on the TicketNFT contract
// Run this script with: npx hardhat run scripts/mint-tickets.js --network <network_name>

const { ethers, network } = require('hardhat');
const { loadDeploymentInfo, logGasUsage, getCurrentTimestamp } = require('./utils/helpers');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);

  // Get the network name
  const networkName = network.name;
  console.log(`Network: ${networkName}`);

  // Try to load deployment info
  let contractAddress;
  const deploymentInfo = loadDeploymentInfo(networkName);

  if (deploymentInfo && deploymentInfo.contractAddress) {
    contractAddress = deploymentInfo.contractAddress;
    console.log(`Loaded contract address from deployment file: ${contractAddress}`);
  } else {
    // If no deployment file, ask for contract address
    console.log('No deployment file found. Using CONTRACT_ADDRESS from environment:');
    contractAddress = process.env.CONTRACT_ADDRESS;

    if (!contractAddress) {
      console.error(
        'ERROR: Please set CONTRACT_ADDRESS in your .env file or provide it as an argument'
      );
      process.exit(1);
    }
  }

  // Get the contract instance
  const TicketNFT = await ethers.getContractFactory('TicketNFT');
  const ticketNFT = TicketNFT.attach(contractAddress);
  console.log(`Connected to TicketNFT at ${contractAddress}`);

  // Create ticket metadata
  const currentTime = getCurrentTimestamp();
  const validFrom = currentTime + 3600; // 1 hour from now
  const validUntil = currentTime + 86400; // 24 hours from now

  const ticketMetadata = {
    eventId: 1, // Event ID
    price: ethers.parseEther('0.1'), // 0.1 ETH - ethers v6 syntax
    validFrom: BigInt(validFrom),
    validUntil: BigInt(validUntil),
    isTransferable: true, // Can be transferred to others
  };

  // Mint a ticket to the recipient
  console.log('Minting a ticket...');
  const recipientAddress = deployer.address; // Or any other address
  const tokenId = 1; // Token ID (should be unique)

  try {
    const tx = await ticketNFT.mintTicket(recipientAddress, tokenId, ticketMetadata);

    console.log(`Transaction hash: ${tx.hash}`);
    console.log('Waiting for transaction confirmation...');

    // Use our utility to log gas usage
    await logGasUsage(tx, 'Mint Ticket');

    console.log(`Successfully minted ticket #${tokenId} to ${recipientAddress}`);

    // Verify the ticket metadata
    console.log('Fetching ticket metadata...');
    const metadata = await ticketNFT.getTicketMetadata(tokenId);

    console.log('Ticket Metadata:');
    console.log('===============');
    console.log(`Event ID: ${metadata.eventId}`);
    console.log(`Price: ${ethers.formatEther(metadata.price)} ETH`); // ethers v6 syntax
    console.log(`Valid From: ${new Date(Number(metadata.validFrom) * 1000).toLocaleString()}`);
    console.log(`Valid Until: ${new Date(Number(metadata.validUntil) * 1000).toLocaleString()}`);
    console.log(`Transferable: ${metadata.isTransferable}`);
  } catch (error) {
    console.error('Error minting ticket:');
    console.error(error.message);

    // Check if the error is related to permissions
    if (error.message.includes('AccessControl')) {
      console.log('\nThis might be a permissions issue. Try getting the MINTER_ROLE:');
      console.log(`const MINTER_ROLE = await ticketNFT.MINTER_ROLE()`);
      console.log(`await ticketNFT.grantRole(MINTER_ROLE, "${deployer.address}")`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
