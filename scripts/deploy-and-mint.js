// Script that deploys the contract and mints a ticket in one go
// Run with: npx hardhat run scripts/deploy-and-mint.js

const { ethers, network } = require('hardhat');
const { saveDeploymentInfo, getCurrentTimestamp } = require('./utils/helpers');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);
  console.log(`Network: ${network.name}`);

  // Step 1: Deploy the contract
  console.log('\n--- DEPLOYING CONTRACT ---');
  const TicketNFT = await ethers.getContractFactory('TicketNFT');
  const ticketNFT = await TicketNFT.deploy();
  await ticketNFT.waitForDeployment();

  const contractAddress = await ticketNFT.getAddress();
  console.log(`TicketNFT deployed to: ${contractAddress}`);

  // Save deployment information
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployer: deployer.address,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: Math.floor(Date.now() / 1000),
  };

  // Save for the current network
  saveDeploymentInfo(network.name, deploymentInfo);

  // Step 2: Set up roles
  console.log('\n--- SETTING UP ROLES ---');
  const MINTER_ROLE = await ticketNFT.MINTER_ROLE();
  await ticketNFT.grantRole(MINTER_ROLE, deployer.address);
  console.log(`Granted MINTER_ROLE to ${deployer.address}`);

  // Step 3: Mint tickets
  console.log('\n--- MINTING TICKETS ---');

  // Create ticket metadata
  const currentTime = getCurrentTimestamp();
  const validFrom = currentTime + 3600; // 1 hour from now
  const validUntil = currentTime + 86400; // 24 hours from now

  // Mint 3 tickets with different properties
  for (let i = 1; i <= 3; i++) {
    const ticketMetadata = {
      eventId: i,
      price: ethers.parseEther(`0.${i}`), // 0.1, 0.2, 0.3 ETH
      validFrom: BigInt(validFrom),
      validUntil: BigInt(validUntil),
      isTransferable: i % 2 === 1, // Alternating transferability
    };

    console.log(`\nMinting ticket #${i}...`);
    const tx = await ticketNFT.mintTicket(deployer.address, i, ticketMetadata);
    await tx.wait();
    console.log(`Successfully minted ticket #${i} to ${deployer.address}`);

    // Verify the ticket metadata
    const metadata = await ticketNFT.getTicketMetadata(i);
    console.log(`Event ID: ${metadata.eventId}`);
    console.log(`Price: ${ethers.formatEther(metadata.price)} ETH`);
    console.log(`Valid From: ${new Date(Number(metadata.validFrom) * 1000).toLocaleString()}`);
    console.log(`Valid Until: ${new Date(Number(metadata.validUntil) * 1000).toLocaleString()}`);
    console.log(`Transferable: ${metadata.isTransferable}`);
  }

  console.log('\n--- DEPLOYMENT AND MINTING COMPLETE ---');
  console.log(`Contract address: ${contractAddress}`);
  console.log('3 tickets have been minted to your account');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
