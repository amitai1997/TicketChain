// hardhat-test-mint.js - Mint a ticket using Hardhat's built-in features
// Run with: npx hardhat run scripts/hardhat-test-mint.js --network localhost

const hre = require("hardhat");

async function main() {
  console.log("Testing mint ticket functionality with Hardhat");
  
  // Get signers from Hardhat
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);
  
  // Get the contract - updated for ethers v6
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const TicketNFT = await hre.ethers.getContractFactory("TicketNFT");
  
  // For ethers v6, we use getContractAt instead of attach
  const ticketNFT = await hre.ethers.getContractAt("TicketNFT", contractAddress);
  console.log(`Connected to TicketNFT at ${contractAddress}`);
  
  try {
    // First, check if deployer has MINTER_ROLE
    const MINTER_ROLE = await ticketNFT.MINTER_ROLE();
    const hasMinterRole = await ticketNFT.hasRole(MINTER_ROLE, deployer.address);
    console.log(`Account has MINTER_ROLE: ${hasMinterRole}`);
    
    if (!hasMinterRole) {
      // Grant MINTER_ROLE if needed
      console.log("Granting MINTER_ROLE...");
      const tx = await ticketNFT.grantRole(MINTER_ROLE, deployer.address);
      await tx.wait();
      console.log("MINTER_ROLE granted");
    }
    
    // Prepare token ID
    let tokenId = 1;
    
    // Check if token ID is already used
    try {
      await ticketNFT.ownerOf(tokenId);
      console.log(`Token ID ${tokenId} already exists`);
      
      // Get next token ID from total supply
      const totalSupply = await ticketNFT.totalSupply();
      tokenId = Number(totalSupply) + 1;
      console.log(`Using next token ID: ${tokenId}`);
    } catch (error) {
      // Token doesn't exist, proceed
      console.log(`Token ID ${tokenId} is available for minting`);
    }
    
    // Prepare metadata - with BigInt for ethers v6
    const currentTime = Math.floor(Date.now() / 1000);
    const metadata = {
      eventId: 1,
      price: hre.ethers.parseEther("0.1"),
      validFrom: BigInt(currentTime + 3600), // 1 hour from now
      validUntil: BigInt(currentTime + 7200), // 2 hours from now
      isTransferable: true
    };
    
    console.log("Minting ticket with metadata:", {
      eventId: metadata.eventId,
      price: hre.ethers.formatEther(metadata.price) + " ETH",
      validFrom: new Date(Number(metadata.validFrom) * 1000).toLocaleString(),
      validUntil: new Date(Number(metadata.validUntil) * 1000).toLocaleString(),
      isTransferable: metadata.isTransferable
    });
    
    // Try different approaches to mint the ticket
    console.log("\nTrying different minting approaches:");
    
    try {
      console.log("Method 1: Using struct directly");
      const tx = await ticketNFT.mintTicket(
        deployer.address,
        tokenId,
        metadata,
        { gasLimit: 5000000 }
      );
      
      console.log(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed: ${receipt.hash}`);
      
      // Verify token was minted
      const owner = await ticketNFT.ownerOf(tokenId);
      console.log(`Token #${tokenId} minted to: ${owner}`);
      
      console.log("Method 1 successful!");
      return;
    } catch (error) {
      console.error("Method 1 failed:", error.message);
    }
    
    try {
      console.log("\nMethod 2: Using array for struct");
      const metadataArray = [
        metadata.eventId,
        metadata.price,
        metadata.validFrom,
        metadata.validUntil,
        metadata.isTransferable
      ];
      
      const tx = await ticketNFT.mintTicket(
        deployer.address,
        tokenId,
        metadataArray,
        { gasLimit: 5000000 }
      );
      
      console.log(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed: ${receipt.hash}`);
      
      // Verify token was minted
      const owner = await ticketNFT.ownerOf(tokenId);
      console.log(`Token #${tokenId} minted to: ${owner}`);
      
      console.log("Method 2 successful!");
      return;
    } catch (error) {
      console.error("Method 2 failed:", error.message);
    }
    
    // If we got here, all methods failed
    throw new Error("All minting methods failed");
    
  } catch (error) {
    console.error("Error in test:", error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("Test completed successfully!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
  });
