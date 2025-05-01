// deploy-and-setup.js
// Script to deploy the TicketChain contract and create some test events

// Run this script with: npx hardhat run scripts/deploy-and-setup.js --network localhost

const { ethers } = require("hardhat");

async function main() {
  console.log("Starting TicketChain deployment and setup...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);
  console.log(`Account balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);

  // Deploy the TicketNFT contract
  console.log("Deploying TicketNFT contract...");
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const ticketNFT = await TicketNFT.deploy();
  await ticketNFT.deployed();

  console.log(`TicketNFT deployed to: ${ticketNFT.address}`);

  // Create some test events
  console.log("Creating test events...");

  // Event 1: Concert
  const concert = {
    name: "Summer Music Festival 2025",
    description: "A multi-day music festival featuring top artists and bands.",
    ticketPrice: ethers.utils.parseEther("0.05"),
    maxTickets: 1000,
    eventDate: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
    minResalePrice: ethers.utils.parseEther("0.03"),
    maxResalePrice: ethers.utils.parseEther("0.1"),
    royaltyPercentage: 1000 // 10%
  };

  // Event 2: Conference
  const conference = {
    name: "Blockchain Innovation Summit",
    description: "A conference for blockchain enthusiasts, developers, and entrepreneurs.",
    ticketPrice: ethers.utils.parseEther("0.025"),
    maxTickets: 500,
    eventDate: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60, // 14 days from now
    minResalePrice: ethers.utils.parseEther("0.02"),
    maxResalePrice: ethers.utils.parseEther("0.05"),
    royaltyPercentage: 1500 // 15%
  };

  // Event 3: Sports Game
  const sportsGame = {
    name: "Championship Finals",
    description: "The ultimate showdown to determine this year's champions.",
    ticketPrice: ethers.utils.parseEther("0.08"),
    maxTickets: 750,
    eventDate: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
    minResalePrice: ethers.utils.parseEther("0.05"),
    maxResalePrice: ethers.utils.parseEther("0.15"),
    royaltyPercentage: 2000 // 20%
  };

  // Create events on chain
  console.log("Creating event 1: Summer Music Festival...");
  const tx1 = await ticketNFT.createEvent(
    concert.name,
    concert.description,
    concert.ticketPrice,
    concert.maxTickets,
    concert.eventDate,
    concert.minResalePrice,
    concert.maxResalePrice,
    concert.royaltyPercentage
  );
  await tx1.wait();

  console.log("Creating event 2: Blockchain Innovation Summit...");
  const tx2 = await ticketNFT.createEvent(
    conference.name,
    conference.description,
    conference.ticketPrice,
    conference.maxTickets,
    conference.eventDate,
    conference.minResalePrice,
    conference.maxResalePrice,
    conference.royaltyPercentage
  );
  await tx2.wait();

  console.log("Creating event 3: Championship Finals...");
  const tx3 = await ticketNFT.createEvent(
    sportsGame.name,
    sportsGame.description,
    sportsGame.ticketPrice,
    sportsGame.maxTickets,
    sportsGame.eventDate,
    sportsGame.minResalePrice,
    sportsGame.maxResalePrice,
    sportsGame.royaltyPercentage
  );
  await tx3.wait();

  // Mint some tickets for the deployer
  console.log("Minting test tickets...");

  // Mint a ticket for event 1
  console.log("Minting ticket for Summer Music Festival...");
  const mintTx1 = await ticketNFT.mintTicket(
    1, // Event ID
    "ipfs://test-metadata-1", // Metadata URI
    { value: concert.ticketPrice }
  );
  await mintTx1.wait();

  // Mint a ticket for event 2
  console.log("Minting ticket for Blockchain Innovation Summit...");
  const mintTx2 = await ticketNFT.mintTicket(
    2, // Event ID
    "ipfs://test-metadata-2", // Metadata URI
    { value: conference.ticketPrice }
  );
  await mintTx2.wait();

  // Get event count to verify setup
  const eventCount = await ticketNFT.getEventCount();
  console.log(`Total events created: ${eventCount}`);

  // Get ticket count for deployer
  const deployerTicketCount = await ticketNFT.balanceOf(deployer.address);
  console.log(`Deployer ticket count: ${deployerTicketCount}`);

  console.log("Setup completed successfully!");
  console.log("Contract address:", ticketNFT.address);
  console.log("✅ TicketChain is ready to use!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });