// Simple script to mint tickets on the TicketNFT contract
// Run this script with: npx hardhat run scripts/mint-tickets.js --network <network_name>

const { ethers, network } = require('hardhat');
const { loadDeploymentInfo, getCurrentTimestamp } = require('./utils/helpers');

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

  // Get the contract factory
  const TicketNFT = await ethers.getContractFactory('TicketNFT');
  
  // Deploy the contract (this changes in ethers v6)
  // Unlike v5's attach(), we use the contract factory to get a deployed instance at a specific address
  const ticketNFT = TicketNFT.attach(contractAddress);
  
  console.log(`Connected to TicketNFT at ${contractAddress}`);

  // Generate a unique token ID to avoid conflicts
  const tokenId = Math.floor(Math.random() * 10000) + 100;
  console.log(`Using token ID: ${tokenId}`);

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

  try {
    // Step 1: Get the MINTER_ROLE and check if the deployer has it
    const MINTER_ROLE = await ticketNFT.MINTER_ROLE();
    const hasMinterRole = await ticketNFT.hasRole(MINTER_ROLE, deployer.address);

    // Step 2: Grant role if needed
    if (!hasMinterRole) {
      console.log(`Granting MINTER_ROLE to ${deployer.address}...`);
      const tx = await ticketNFT.grantRole(MINTER_ROLE, deployer.address);
      await tx.wait();
      console.log(`Role granted successfully!`);
    } else {
      console.log(`Account already has MINTER_ROLE.`);
    }

    // Step 3: Mint a ticket
    console.log('Minting a ticket...');
    const tx = await ticketNFT.mintTicket(deployer.address, tokenId, ticketMetadata);
    console.log(`Transaction hash: ${tx.hash}`);

    // Wait for the transaction to be mined
    console.log('Waiting for transaction confirmation...');
    const receipt = await tx.wait();
    console.log(`Transaction confirmed! Gas used: ${receipt.gasUsed.toString()}`);
    console.log(`Successfully minted ticket #${tokenId} to ${deployer.address}`);

    // Step 4: Verify the ticket metadata
    console.log('Fetching ticket metadata...');
    const metadata = await ticketNFT.getTicketMetadata(tokenId);

    console.log('Ticket Metadata:');
    console.log('===============');
    console.log(`Event ID: ${metadata.eventId}`);
    console.log(`Price: ${ethers.formatEther(metadata.price)} ETH`);
    console.log(`Valid From: ${new Date(Number(metadata.validFrom) * 1000).toLocaleString()}`);
    console.log(`Valid Until: ${new Date(Number(metadata.validUntil) * 1000).toLocaleString()}`);
    console.log(`Transferable: ${metadata.isTransferable}`);
  } catch (error) {
    console.error('Error:');
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
