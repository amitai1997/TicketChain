const { ethers } = require("hardhat");

async function main() {
  console.log("Starting interaction with TicketNFT contract...");
  
  // Get the deployed contract
  // You can replace this address with your actual deployed contract address
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const contract = await TicketNFT.attach(contractAddress);
  
  console.log(`Connected to TicketNFT at ${contractAddress}`);
  
  // Get accounts
  const [owner, addr1, addr2] = await ethers.getSigners();
  console.log(`Using account: ${owner.address}`);
  
  // Create an event
  console.log("Creating a new event...");
  const eventName = "Summer Music Festival";
  const tx = await contract.createEvent(
    eventName,
    "Annual summer music festival featuring top artists",
    ethers.utils.parseEther("0.1"),      // ticketPrice
    100,                                 // maxTickets
    Math.floor(Date.now()/1000) + 86400, // eventDate (tomorrow)
    ethers.utils.parseEther("0.05"),     // minResalePrice
    ethers.utils.parseEther("0.2"),      // maxResalePrice
    500                                  // royaltyPercentage (5%)
  );
  
  await tx.wait();
  console.log(`Event created: ${eventName}`);
  
  // Get event details
  const eventId = 1;
  const event = await contract.getEvent(eventId);
  console.log("\nEvent details:");
  console.log(`Name: ${event.name}`);
  console.log(`Description: ${event.description}`);
  console.log(`Ticket Price: ${ethers.utils.formatEther(event.ticketPrice)} ETH`);
  console.log(`Max Tickets: ${event.maxTickets.toString()}`);
  console.log(`Tickets Sold: ${event.ticketsSold.toString()}`);
  console.log(`Event Date: ${new Date(event.eventDate.toNumber() * 1000).toLocaleString()}`);
  console.log(`Min Resale Price: ${ethers.utils.formatEther(event.minResalePrice)} ETH`);
  console.log(`Max Resale Price: ${ethers.utils.formatEther(event.maxResalePrice)} ETH`);
  console.log(`Royalty Percentage: ${event.royaltyPercentage.toNumber() / 100}%`);
  
  // Mint a ticket as addr1
  console.log("\nMinting a ticket as addr1...");
  const mintTx = await contract.connect(addr1).mintTicket(
    eventId,
    "ipfs://QmTicketMetadata12345",  // metadataURI
    { value: ethers.utils.parseEther("0.1") } // payment matching the ticket price
  );
  
  const mintReceipt = await mintTx.wait();
  
  // Find the TokenId from the event logs
  const mintEvent = mintReceipt.events.find(event => event.event === 'TicketMinted');
  const tokenId = mintEvent.args.tokenId;
  
  console.log(`Ticket minted with tokenId: ${tokenId}`);
  console.log(`Owner: ${await contract.ownerOf(tokenId)}`);
  
  // List the ticket for resale
  console.log("\nListing ticket for resale...");
  const resalePrice = ethers.utils.parseEther("0.15");
  const listTx = await contract.connect(addr1).listTicketForResale(tokenId, resalePrice);
  await listTx.wait();
  
  console.log(`Ticket #${tokenId} listed for resale at ${ethers.utils.formatEther(resalePrice)} ETH`);
  
  // Check the resale price
  const listedPrice = await contract.ticketResalePrices(tokenId);
  console.log(`Current resale price: ${ethers.utils.formatEther(listedPrice)} ETH`);
  
  // Get updated event stats
  const updatedEvent = await contract.getEvent(eventId);
  console.log("\nUpdated event stats:");
  console.log(`Total tickets sold: ${updatedEvent.ticketsSold.toString()}`);
  
  // Check if the ticket is valid
  const isValid = await contract.isTicketValid(tokenId);
  console.log(`\nIs ticket valid? ${isValid}`);
  
  console.log("\nInteraction script completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Error in interaction script:");
    console.error(error);
    process.exit(1);
  });
