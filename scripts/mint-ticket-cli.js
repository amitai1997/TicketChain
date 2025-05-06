// mint-ticket-cli.js - Command line tool for minting tickets
// Run with: node scripts/mint-ticket-cli.js

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Log ethers version
console.log(`Using ethers.js version: ${ethers.version}`);

// Contract info
const CONTRACT_ADDRESS =
  process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// Load ABI from artifact
const abiPath = path.join(__dirname, '../artifacts/contracts/TicketNFT.sol/TicketNFT.json');
const contractData = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
const contractABI = contractData.abi;

// Default provider and network
const DEFAULT_NETWORK = 'http://localhost:8545';
// Make sure the private key has the 0x prefix
const PRIVATE_KEY =
  process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // default Hardhat #0 account

// Global wallet variable so it's accessible in Method 3
let wallet;

async function mintTicket() {
  try {
    console.log(`⚙️ Starting ticket minting process...`);
    console.log(`📝 Contract address: ${CONTRACT_ADDRESS}`);

    // Connect to the network - ethers v6 style
    const provider = new ethers.JsonRpcProvider(DEFAULT_NETWORK);
    console.log(`🌐 Connected to network: ${DEFAULT_NETWORK}`);

    // Create wallet from private key
    wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const signerAddress = await wallet.getAddress();
    console.log(`👛 Using wallet: ${signerAddress}`);

    // Connect to the contract
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);
    console.log(`🔗 Connected to contract`);

    // Check if account has MINTER_ROLE
    const MINTER_ROLE = await contract.MINTER_ROLE();
    console.log(`🔑 MINTER_ROLE: ${MINTER_ROLE}`);

    const hasMinterRole = await contract.hasRole(MINTER_ROLE, signerAddress);
    console.log(`🧰 Account has MINTER_ROLE: ${hasMinterRole}`);

    if (!hasMinterRole) {
      console.log(`⚠️ Account doesn't have MINTER_ROLE, attempting to grant...`);

      const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE();
      const isAdmin = await contract.hasRole(DEFAULT_ADMIN_ROLE, signerAddress);
      console.log(`👑 Account has DEFAULT_ADMIN_ROLE: ${isAdmin}`);

      if (isAdmin) {
        const grantTx = await contract.grantRole(MINTER_ROLE, signerAddress);
        await grantTx.wait();
        console.log(`✅ MINTER_ROLE granted!`);
      } else {
        throw new Error('Account is not an admin and cannot mint tickets');
      }
    }

    // Prepare token data
    const tokenId = 1;

    // Check if token already exists
    try {
      const owner = await contract.ownerOf(tokenId);
      console.log(`⚠️ Token #${tokenId} already exists and is owned by: ${owner}`);
      console.log(`👉 Using next token ID instead...`);

      // Get total supply
      const totalSupply = await contract.totalSupply();
      const nextTokenId = Number(totalSupply) + 1;
      console.log(`⏭️ Next token ID: ${nextTokenId}`);

      // Continue with the next token ID
      await mintNewToken(contract, signerAddress, nextTokenId);
    } catch (error) {
      // Token doesn't exist, proceed with original ID
      if (error.message && error.message.includes('owner query for nonexistent token')) {
        console.log(`👍 Token #${tokenId} is available for minting`);
        await mintNewToken(contract, signerAddress, tokenId);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error(`❌ Error during minting:`, error);

    // More detailed error info
    if (error.info) {
      console.error(`📛 Error info:`, error.info);
    }
    if (error.code) {
      console.error(`📛 Code: ${error.code}`);
    }
    if (error.message) {
      console.error(`📛 Message: ${error.message}`);
    }
  }
}

async function mintNewToken(contract, to, tokenId) {
  // Prepare metadata
  const currentTime = Math.floor(Date.now() / 1000);
  const ticketMetadata = {
    eventId: 1,
    price: ethers.parseEther('0.1'),
    validFrom: BigInt(currentTime + 3600), // 1 hour from now
    validUntil: BigInt(currentTime + 7200), // 2 hours from now
    isTransferable: true,
  };

  console.log(`📋 Preparing to mint ticket #${tokenId} with metadata:`, {
    eventId: ticketMetadata.eventId,
    price: ethers.formatEther(ticketMetadata.price) + ' ETH',
    validFrom: new Date(Number(ticketMetadata.validFrom) * 1000).toLocaleString(),
    validUntil: new Date(Number(ticketMetadata.validUntil) * 1000).toLocaleString(),
    isTransferable: ticketMetadata.isTransferable,
  });

  // For troubleshooting, try calling the function with different parameter formats
  console.log(`🔨 Attempting to mint ticket...`);

  try {
    // Approach 1: Using the struct directly
    console.log('Method 1: Using the struct directly...');
    const tx = await contract.mintTicket(
      to,
      tokenId,
      ticketMetadata,
      { gasLimit: 5000000 } // High gas limit
    );

    console.log(`📤 Transaction sent: ${tx.hash}`);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log(`📥 Transaction confirmed: ${receipt.hash}`);

    // Verify the token was minted
    const owner = await contract.ownerOf(tokenId);
    console.log(`🎯 Token #${tokenId} minted to: ${owner}`);

    // Get the token metadata
    const metadata = await contract.getTicketMetadata(tokenId);
    console.log('📄 Fetched metadata:', {
      eventId: metadata.eventId.toString(),
      price: ethers.formatEther(metadata.price) + ' ETH',
      validFrom: new Date(Number(metadata.validFrom) * 1000).toLocaleString(),
      validUntil: new Date(Number(metadata.validUntil) * 1000).toLocaleString(),
      isTransferable: metadata.isTransferable,
    });

    console.log('✅ Minting successful!');
    return;
  } catch (error) {
    console.error('❌ Method 1 failed:', error.message || error);
    console.log('🔄 Trying alternative method...');
  }

  try {
    // Approach 2: Using array for the struct
    console.log('Method 2: Using array for the struct...');
    const metadataArray = [
      ticketMetadata.eventId,
      ticketMetadata.price,
      ticketMetadata.validFrom,
      ticketMetadata.validUntil,
      ticketMetadata.isTransferable,
    ];

    const tx = await contract.mintTicket(
      to,
      tokenId,
      metadataArray,
      { gasLimit: 5000000 } // High gas limit
    );

    console.log(`📤 Transaction sent: ${tx.hash}`);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log(`📥 Transaction confirmed: ${receipt.hash}`);

    // Verify the token was minted
    const owner = await contract.ownerOf(tokenId);
    console.log(`🎯 Token #${tokenId} minted to: ${owner}`);

    console.log('✅ Minting successful (method 2)!');
    return;
  } catch (error) {
    console.error('❌ Method 2 failed:', error.message || error);
    console.log('🔄 Trying low-level method...');
  }

  try {
    // Approach 3: Using manual ABI encoding
    console.log('Method 3: Using manual ABI encoding...');

    // Create interface for function encoding
    const iface = new ethers.Interface([
      'function mintTicket(address to, uint256 tokenId, tuple(uint256 eventId, uint256 price, uint256 validFrom, uint256 validUntil, bool isTransferable) metadata)',
    ]);

    // Encode function data
    const data = iface.encodeFunctionData('mintTicket', [
      to,
      tokenId,
      [
        ticketMetadata.eventId,
        ticketMetadata.price,
        ticketMetadata.validFrom,
        ticketMetadata.validUntil,
        ticketMetadata.isTransferable,
      ],
    ]);

    // Send transaction with manual encoding
    const tx = await wallet.sendTransaction({
      to: CONTRACT_ADDRESS,
      data: data,
      gasLimit: 5000000,
    });

    console.log(`📤 Transaction sent: ${tx.hash}`);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log(`📥 Transaction confirmed: ${receipt.hash}`);

    // Verify the token was minted
    const owner = await contract.ownerOf(tokenId);
    console.log(`🎯 Token #${tokenId} minted to: ${owner}`);

    console.log('✅ Minting successful (method 3)!');
    return;
  } catch (error) {
    console.error('❌ Method 3 failed:', error.message || error);

    // One last approach - using the tuple syntax directly
    try {
      console.log('Method 4: Using direct struct components...');

      const tx = await contract.mintTicket(
        to,
        tokenId,
        [
          ticketMetadata.eventId,
          ticketMetadata.price,
          ticketMetadata.validFrom,
          ticketMetadata.validUntil,
          ticketMetadata.isTransferable,
        ],
        { gasLimit: 5000000 }
      );

      console.log(`📤 Transaction sent: ${tx.hash}`);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log(`📥 Transaction confirmed: ${receipt.hash}`);

      // Verify the token was minted
      const owner = await contract.ownerOf(tokenId);
      console.log(`🎯 Token #${tokenId} minted to: ${owner}`);

      console.log('✅ Minting successful (method 4)!');
      return;
    } catch (error) {
      console.error('❌ Method 4 failed:', error.message || error);
      throw new Error('All minting methods failed');
    }
  }
}

// Execute main function
mintTicket()
  .then(() => {
    console.log('Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
