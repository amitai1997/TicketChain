/* global hre */
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers, network } = require('hardhat');
const { saveDeploymentInfo, logGasUsage } = require('./utils/helpers');

async function main() {
  console.log('Starting deployment to', network.name, 'network...');
  console.log('Network Chain ID:', network.config.chainId);

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  // Format balance to ETH for readability - using ethers v6 compatible code
  const balanceInWei = await ethers.provider.getBalance(deployer.address);
  const balanceInEth = ethers.formatEther(balanceInWei);
  console.log('Account balance:', balanceInEth, 'ETH');

  // We get the contract to deploy
  console.log('Compiling contract...');
  const TicketNFT = await ethers.getContractFactory('TicketNFT');

  console.log('Deploying TicketNFT...');
  const ticket = await TicketNFT.deploy();

  console.log('Waiting for deployment transaction...');
  // In ethers v6, we need to wait for the contract explicitly
  await ticket.waitForDeployment();

  // In ethers v6, contract address is accessed differently
  const contractAddress = await ticket.getAddress();
  console.log(`TicketNFT deployed to: ${contractAddress}`);
  console.log(`Network: ${network.name} (Chain ID: ${network.config.chainId})`);

  // Save deployment info to a file for future reference
  const deploymentTx = await ticket.deploymentTransaction();
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    transactionHash: deploymentTx ? deploymentTx.hash : null,
    verified: false,
  };

  // Save deployment info using our utility function
  saveDeploymentInfo(network.name, deploymentInfo);

  // Handle verification for non-local networks
  if (network.name !== 'hardhat' && network.name !== 'localhost') {
    console.log('Waiting for block confirmations...');

    // In ethers v6, we get the transaction differently
    if (deploymentTx) {
      // Wait for confirmations
      await deploymentTx.wait(2);

      // Verify contract on Etherscan/Blockscout if we're on a public network
      try {
        console.log('Verifying contract on explorer...');
        await hre.run('verify:verify', {
          address: contractAddress,
          contract: 'contracts/TicketNFT.sol:TicketNFT',
          constructorArguments: [],
        });
        console.log('Contract verified!');

        // Update deployment info with verification status
        deploymentInfo.verified = true;
        deploymentInfo.verificationTime = new Date().toISOString();
        saveDeploymentInfo(network.name, deploymentInfo);
      } catch (error) {
        console.error('Error verifying contract:', error.message);
        console.log('You may need to wait a few minutes before verifying the contract.');
        console.log('You can manually verify later with:');
        console.log(`npx hardhat run scripts/utils/verify-contract.js --network ${network.name}`);
      }
    }
  }

  console.log('Deployment completed successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Create an .env file based on .env.example');
  console.log('2. To interact with the contract:');
  console.log(`   - Access the contract at: ${contractAddress}`);
  console.log('   - Run: npm run mint -- --network ' + network.name);
  console.log('');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error in deployment:');
    console.error(error);
    process.exit(1);
  });
