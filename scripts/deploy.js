// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers, network } = require("hardhat");

async function main() {
  console.log("Starting deployment to", network.name, "network...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // We get the contract to deploy
  console.log("Compiling contract...");
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  
  console.log("Deploying TicketNFT...");
  const ticket = await TicketNFT.deploy();

  console.log("Waiting for deployment transaction...");
  await ticket.deployed();

  console.log(`TicketNFT deployed to: ${ticket.address} on network: ${network.name}`);
  
  // Don't need to wait for confirmations on local networks
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    // Reduce confirmations to 2 for testnets
    await ticket.deployTransaction.wait(2);
    
    // Verify contract on Etherscan/Blockscout if we're on a public network
    try {
      console.log("Verifying contract on explorer...");
      await hre.run("verify:verify", {
        address: ticket.address,
        contract: "contracts/TicketNFT.sol:TicketNFT",
        constructorArguments: [],
      });
      console.log("Contract verified!");
    } catch (error) {
      console.error("Error verifying contract:", error.message);
    }
  }
  
  console.log("Deployment completed successfully!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in deployment:");
    console.error(error);
    process.exit(1);
  });
