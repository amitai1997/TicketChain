// A simple script to mint tickets on an existing TicketNFT contract
// Run with: npx hardhat run scripts/mint-simple.js

const { ethers, network } = require('hardhat');
const { loadDeploymentInfo, getCurrentTimestamp } = require('./utils/helpers');

// Hard-coded role values (avoids calling the contract for these values)
const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6"; // keccak256("MINTER_ROLE")

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);
  console.log(`Network: ${network.name}`);
  
  // Try to load deployment info
  const networkName = network.name;
  const deploymentInfo = loadDeploymentInfo(networkName);
  
  if (!deploymentInfo || !deploymentInfo.contractAddress) {
    console.error(`No deployment found for network ${networkName}.`);
    console.error(`Please run 'pnpm deploy:dev' or 'pnpm deploy:local' first.`);
    process.exit(1);
  }
  
  const contractAddress = deploymentInfo.contractAddress;
  console.log(`Found deployed contract at: ${contractAddress}`);

  // Deploy the contract again to get the contract factory
  console.log('\n--- CONNECTING TO CONTRACT ---');
  const TicketNFT = await ethers.getContractFactory('TicketNFT');
  // Use the getContractAt method from hardhat to get the contract instance
  const ticketNFT = await ethers.getContractAt('TicketNFT', contractAddress);
  console.log(`Connected to TicketNFT at ${contractAddress}`);

  // Step 2: Set up roles
  console.log('\n--- SETTING UP ROLES ---');
  console.log(`Using hard-coded MINTER_ROLE: ${MINTER_ROLE}`);
  
  // Check if deployer already has minter role
  const hasRole = await ticketNFT.hasRole(MINTER_ROLE, deployer.address);
  
  if (!hasRole) {
    // Grant the role to the deployer
    await ticketNFT.grantRole(MINTER_ROLE, deployer.address);
    console.log(`Granted MINTER_ROLE to ${deployer.address}`);
  } else {
    console.log(`Deployer already has MINTER_ROLE`);
  }

  // Step 3: Mint tickets
  console.log('\n--- MINTING TICKETS ---');

  // Create ticket metadata
  const currentTime = getCurrentTimestamp();
  const validFrom = currentTime + 3600; // 1 hour from now
  const validUntil = currentTime + 86400; // 24 hours from now

  // Generate a unique token ID to avoid conflicts with existing tokens
  const tokenId = Math.floor(Math.random() * 10000) + 1000;
  console.log(`Using token ID: ${tokenId}`);
  
  const ticketMetadata = {
    eventId: tokenId, // Use tokenId as eventId for uniqueness
    price: ethers.parseEther('0.1'), // 0.1 ETH
    validFrom: BigInt(validFrom),
    validUntil: BigInt(validUntil),
    isTransferable: true, // Can be transferred to others
  };

  console.log(`\nMinting ticket #${tokenId}...`);
  const tx = await ticketNFT.mintTicket(deployer.address, tokenId, ticketMetadata);
  console.log(`Transaction hash: ${tx.hash}`);
  
  console.log('Waiting for transaction confirmation...');
  const receipt = await tx.wait();
  console.log(`Successfully minted ticket #${tokenId} to ${deployer.address}`);
  console.log(`Gas used: ${receipt.gasUsed.toString()}`);

  // Verify the ticket metadata
  console.log('\nVerifying ticket metadata...');
  const metadata = await ticketNFT.getTicketMetadata(tokenId);
  console.log('Ticket Metadata:');
  console.log('===============');
  console.log(`Event ID: ${metadata.eventId}`);
  console.log(`Price: ${ethers.formatEther(metadata.price)} ETH`);
  console.log(`Valid From: ${new Date(Number(metadata.validFrom) * 1000).toLocaleString()}`);
  console.log(`Valid Until: ${new Date(Number(metadata.validUntil) * 1000).toLocaleString()}`);
  console.log(`Transferable: ${metadata.isTransferable}`);

  // Additional information
  const owner = await ticketNFT.ownerOf(tokenId);
  const isValid = await ticketNFT.isTicketValid(tokenId);
  console.log(`Owner: ${owner}`);
  console.log(`Is Valid: ${isValid}`);

  console.log('\n--- MINTING COMPLETE ---');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:');
    console.error(error.message);
    if (error.message.includes('execution reverted')) {
      console.log('\nThe transaction was reverted by the contract.');
      console.log('This might be due to a permission issue or invalid parameters.');
    }
    process.exit(1);
  });
