const hardhat = require("hardhat");

async function main() {
  // First, check if contract is already deployed at expected address
  const provider = hardhat.ethers.provider;
  const expectedAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  
  let code = await provider.getCode(expectedAddress);
  
  // If the address already has code, it's deployed
  if (code !== '0x') {
    console.log(`Contract already exists at ${expectedAddress}`);
    
    // Try to interact with it to see if it's our contract
    try {
      const TicketNFT = await hardhat.ethers.getContractFactory("TicketNFT");
      const ticketNFT = TicketNFT.attach(expectedAddress);
      
      const name = await ticketNFT.name();
      console.log(`Contract name: ${name}`);
      
      // If we get here, the contract is working fine
      console.log("Contract is working properly");
      
      // Get deployer
      const [deployer] = await hardhat.ethers.getSigners();
      console.log("Connected with address:", deployer.address);
      
      // Check if deployer has MINTER_ROLE
      const MINTER_ROLE = await ticketNFT.MINTER_ROLE();
      const hasMinterRole = await ticketNFT.hasRole(MINTER_ROLE, deployer.address);
      console.log(`Has MINTER_ROLE: ${hasMinterRole}`);
      
      // Grant MINTER_ROLE if needed
      if (!hasMinterRole) {
        console.log(`Granting MINTER_ROLE to ${deployer.address}...`);
        const tx = await ticketNFT.grantRole(MINTER_ROLE, deployer.address);
        await tx.wait();
        console.log(`MINTER_ROLE granted to ${deployer.address}`);
      }
      
      // Return the contract
      return {
        contractAddress: expectedAddress,
        contract: ticketNFT
      };
    } catch (error) {
      console.error("Error interacting with existing contract:", error);
      console.log("Will deploy a new contract...");
    }
  }
  
  // If we get here, we need to deploy a new contract
  const [deployer] = await hardhat.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const TicketNFT = await hardhat.ethers.getContractFactory("TicketNFT");
  const ticketNFT = await TicketNFT.deploy();
  await ticketNFT.deploymentTransaction().wait();

  const contractAddress = await ticketNFT.getAddress();
  console.log("TicketNFT deployed to:", contractAddress);

  // Grant deployer the MINTER_ROLE
  const MINTER_ROLE = await ticketNFT.MINTER_ROLE();
  const grantTx = await ticketNFT.grantRole(MINTER_ROLE, deployer.address);
  await grantTx.wait();
  console.log(`Granted MINTER_ROLE to ${deployer.address}`);
  
  // Return the contract
  return {
    contractAddress,
    contract: ticketNFT
  };
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else {
  module.exports = main;
}
