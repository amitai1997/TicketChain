// Scripts to test minting tickets directly via hardhat
const { ethers } = require('hardhat');

async function main() {
  console.log('Testing ticket minting operation...');

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);

  // Get contract address - default local deployment
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  console.log(`Using contract at: ${contractAddress}`);

  try {
    // Get the contract instance
    const TicketNFT = await ethers.getContractFactory('TicketNFT');
    const ticketNFT = TicketNFT.attach(contractAddress);

    // Prepare metadata
    const currentTime = Math.floor(Date.now() / 1000);
    const ticketMetadata = {
      eventId: 1,
      price: ethers.utils.parseEther('0.1'),
      validFrom: currentTime + 3600, // 1 hour from now
      validUntil: currentTime + 7200, // 2 hours from now
      isTransferable: true,
    };

    console.log('Minting a ticket with metadata:', {
      eventId: ticketMetadata.eventId,
      price: ethers.utils.formatEther(ticketMetadata.price) + ' ETH',
      validFrom: new Date(ticketMetadata.validFrom * 1000).toISOString(),
      validUntil: new Date(ticketMetadata.validUntil * 1000).toISOString(),
      isTransferable: ticketMetadata.isTransferable,
    });

    // Token ID to mint
    const tokenId = 1;

    // Call the mintTicket function
    const tx = await ticketNFT.mintTicket(deployer.address, tokenId, ticketMetadata);

    console.log(`Transaction sent: ${tx.hash}`);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log(`Transaction confirmed: ${receipt.transactionHash}`);

    // Verify the token was minted
    const owner = await ticketNFT.ownerOf(tokenId);
    console.log(`Token #${tokenId} minted to: ${owner}`);

    // Get the token metadata
    const metadata = await ticketNFT.getTicketMetadata(tokenId);
    console.log('Fetched metadata:', {
      eventId: metadata.eventId.toString(),
      price: ethers.utils.formatEther(metadata.price) + ' ETH',
      validFrom: new Date(metadata.validFrom.toNumber() * 1000).toISOString(),
      validUntil: new Date(metadata.validUntil.toNumber() * 1000).toISOString(),
      isTransferable: metadata.isTransferable,
    });

    console.log('✅ Minting test successful!');
  } catch (error) {
    console.error('❌ Error during minting test:', error);

    // Add more detailed error information
    if (error.reason) console.error('Reason:', error.reason);
    if (error.code) console.error('Code:', error.code);
    if (error.transaction) console.error('Transaction:', error.transaction);
    if (error.receipt) console.error('Receipt:', error.receipt);

    // This might mean contract doesn't exist at the address
    if (error.message.includes('call revert exception')) {
      console.error("This could mean the contract doesn't exist at this address.");
      console.error("Try running 'npx hardhat run scripts/deploy.js --network localhost' first.");
    }

    // Suggest checking MINTER_ROLE
    if (error.message.includes('AccessControl')) {
      console.error('This might be a permissions issue. Check if account has MINTER_ROLE.');
    }
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
