// Script to verify contracts on Etherscan or other blockchain explorers
// Usage: npx hardhat run scripts/utils/verify-contract.js --network <network>

const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const networkName = hre.network.name;
  
  if (networkName === 'hardhat' || networkName === 'localhost') {
    console.log("Verification not needed for local networks");
    return;
  }
  
  console.log(`Verifying contracts on ${networkName}...`);
  
  // Try to load deployment info
  let contractAddress;
  try {
    const deploymentInfo = JSON.parse(
      fs.readFileSync(`./deployments/${networkName}-deployment.json`)
    );
    contractAddress = deploymentInfo.contractAddress;
    console.log(`Found contract address: ${contractAddress}`);
  } catch (error) {
    console.error("No deployment file found. Please provide contract address via environment variable CONTRACT_ADDRESS");
    contractAddress = process.env.CONTRACT_ADDRESS;
    
    if (!contractAddress) {
      console.error("Error: CONTRACT_ADDRESS environment variable not set");
      process.exit(1);
    }
  }

  // Wait a bit to ensure the contract is deployed and indexed
  console.log("Waiting 30 seconds before verification to ensure contract is indexed...");
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  try {
    console.log(`Verifying contract at ${contractAddress} on ${networkName}...`);
    await hre.run("verify:verify", {
      address: contractAddress,
      contract: "contracts/TicketNFT.sol:TicketNFT",
      constructorArguments: []
    });
    
    console.log("Contract verification successful!");
    
    // Update deployment info with verification status
    try {
      const deploymentInfo = JSON.parse(
        fs.readFileSync(`./deployments/${networkName}-deployment.json`)
      );
      
      deploymentInfo.verified = true;
      deploymentInfo.verificationTime = new Date().toISOString();
      
      fs.writeFileSync(
        `./deployments/${networkName}-deployment.json`,
        JSON.stringify(deploymentInfo, null, 2)
      );
      
      console.log("Deployment info updated with verification status");
    } catch (error) {
      console.warn("Failed to update deployment info:", error.message);
    }
  } catch (error) {
    console.error("Verification failed:", error.message);
    console.log("You can manually verify the contract with:");
    console.log(`npx hardhat verify --network ${networkName} ${contractAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
