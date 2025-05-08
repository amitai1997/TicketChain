import { ethers } from 'hardhat';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Deploying TicketChain contracts...');

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  // Deploy EventRegistry
  console.log('Deploying EventRegistry...');
  const EventRegistry = await ethers.getContractFactory('EventRegistry');
  const eventRegistry = await EventRegistry.deploy();
  await eventRegistry.waitForDeployment();

  const eventRegistryAddress = await eventRegistry.getAddress();
  console.log(`EventRegistry deployed to: ${eventRegistryAddress}`);

  // Deploy EventTicket with the EventRegistry address
  console.log('Deploying EventTicket...');
  const EventTicket = await ethers.getContractFactory('EventTicket');
  const eventTicket = await EventTicket.deploy(eventRegistryAddress);
  await eventTicket.waitForDeployment();

  const eventTicketAddress = await eventTicket.getAddress();
  console.log(`EventTicket deployed to: ${eventTicketAddress}`);

  // Grant roles if needed (optional in this script)
  // This step is commented out as roles are granted to the deployer by default
  /*
  console.log('Setting up roles...');
  
  // Define roles
  const EVENT_ORGANIZER_ROLE = await eventRegistry.EVENT_ORGANIZER_ROLE();
  const MINTER_ROLE = await eventTicket.MINTER_ROLE();
  
  // Grant roles to specific addresses if needed
  const organizerAddress = "0x..."; // Replace with actual address
  await eventRegistry.grantRole(EVENT_ORGANIZER_ROLE, organizerAddress);
  await eventTicket.grantRole(MINTER_ROLE, organizerAddress);
  */

  // Save deployment information to a file
  const network = process.env.HARDHAT_NETWORK || 'localhost';
  const deploymentDir = path.join(__dirname, '../deployments');

  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deploymentInfo = {
    network,
    deployer: deployer.address,
    eventRegistry: eventRegistryAddress,
    eventTicket: eventTicketAddress,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(deploymentDir, `${network}-deployment.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(
    `Deployment information saved to: ${path.join(deploymentDir, `${network}-deployment.json`)}`
  );
  console.log('Deployment complete!');
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
