// Deploy script specifically for local development
// Run with: npx hardhat run scripts/deploy-local.js --network localhost

const { ethers, network } = require('hardhat');
const { saveDeploymentInfo } = require('./utils/helpers');

async function main() {
  // Check if we're on a local network
  const networkName = network.name;
  if (networkName !== 'localhost' && networkName !== 'hardhat') {
    console.warn(
      `This script is intended for local networks only. Current network: ${networkName}`
    );
    const shouldContinue = process.env.FORCE_DEPLOY === 'true';
    if (!shouldContinue) {
      console.error('Set FORCE_DEPLOY=true to override this check.');
      process.exit(1);
    }
  }

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying TicketNFT contract with account: ${deployer.address}`);

  // Deploy TicketNFT
  const TicketNFT = await ethers.getContractFactory('TicketNFT');
  const ticketNFT = await TicketNFT.deploy();
  await ticketNFT.waitForDeployment();

  const contractAddress = await ticketNFT.getAddress();
  console.log(`TicketNFT deployed to: ${contractAddress}`);

  // Grant MINTER_ROLE to the deployer
  const MINTER_ROLE = await ticketNFT.MINTER_ROLE();
  await ticketNFT.grantRole(MINTER_ROLE, deployer.address);
  console.log(`Granted MINTER_ROLE to ${deployer.address}`);

  // Save deployment information
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployer: deployer.address,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: Math.floor(Date.now() / 1000),
  };

  // Save deployment info for both 'localhost' and 'hardhat' networks
  // to ensure the mint script works in both environments
  saveDeploymentInfo('localhost', deploymentInfo);
  saveDeploymentInfo('hardhat', deploymentInfo);

  console.log('Deployment complete. You can now run the mint script.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
