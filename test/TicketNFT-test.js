const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TicketNFT", function () {
  let TicketNFT;
  let ticketNFT;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    TicketNFT = await ethers.getContractFactory("TicketNFT");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy a new TicketNFT contract before each test
    ticketNFT = await TicketNFT.deploy();
    await ticketNFT.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await ticketNFT.owner()).to.equal(owner.address);
    });

    it("Should have the correct name and symbol", async function () {
      expect(await ticketNFT.name()).to.equal("TicketChain");
      expect(await ticketNFT.symbol()).to.equal("TIX");
    });
  });

  describe("Event Creation", function () {
    it("Should create a new event correctly", async function () {
      const eventName = "Test Event";
      const eventDescription = "This is a test event";
      const ticketPrice = ethers.utils.parseEther("0.1");
      const maxTickets = 100;
      const oneMonthFromNow = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      const minResalePrice = ethers.utils.parseEther("0.05");
      const maxResalePrice = ethers.utils.parseEther("0.2");
      const royaltyPercentage = 500; // 5%

      await ticketNFT.createEvent(
        eventName,
        eventDescription,
        ticketPrice,
        maxTickets,
        oneMonthFromNow,
        minResalePrice,
        maxResalePrice,
        royaltyPercentage
      );

      const event = await ticketNFT.getEvent(1);
      expect(event.name).to.equal(eventName);
      expect(event.description).to.equal(eventDescription);
      expect(event.ticketPrice).to.equal(ticketPrice);
      expect(event.maxTickets).to.equal(maxTickets);
      expect(event.organizer).to.equal(owner.address);
      expect(event.minResalePrice).to.equal(minResalePrice);
      expect(event.maxResalePrice).to.equal(maxResalePrice);
      expect(event.royaltyPercentage).to.equal(royaltyPercentage);
    });

    it("Should fail to create event with past date", async function () {
      const oneDayAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
      
      await expect(
        ticketNFT.createEvent(
          "Past Event",
          "This is a past event",
          ethers.utils.parseEther("0.1"),
          100,
          oneDayAgo,
          ethers.utils.parseEther("0.05"),
          ethers.utils.parseEther("0.2"),
          500
        )
      ).to.be.revertedWith("Event date must be in the future");
    });
  });

  describe("Ticket Minting", function () {
    beforeEach(async function () {
      const eventName = "Concert";
      const eventDescription = "Live music concert";
      const ticketPrice = ethers.utils.parseEther("0.1");
      const maxTickets = 100;
      const oneMonthFromNow = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      const minResalePrice = ethers.utils.parseEther("0.05");
      const maxResalePrice = ethers.utils.parseEther("0.2");
      const royaltyPercentage = 500; // 5%

      await ticketNFT.createEvent(
        eventName,
        eventDescription,
        ticketPrice,
        maxTickets,
        oneMonthFromNow,
        minResalePrice,
        maxResalePrice,
        royaltyPercentage
      );
    });

    it("Should mint a ticket successfully", async function () {
      const eventId = 1;
      const metadataURI = "ipfs://QmXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZ";
      const ticketPrice = ethers.utils.parseEther("0.1");

      await expect(
        ticketNFT.connect(addr1).mintTicket(eventId, metadataURI, {
          value: ticketPrice,
        })
      )
        .to.emit(ticketNFT, "TicketMinted")
        .withArgs(1, eventId, addr1.address);

      expect(await ticketNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await ticketNFT.tokenURI(1)).to.equal(metadataURI);

      const event = await ticketNFT.getEvent(eventId);
      expect(event.ticketsSold).to.equal(1);
    });

    it("Should fail to mint with insufficient payment", async function () {
      const eventId = 1;
      const metadataURI = "ipfs://QmXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZ";
      const insufficientPayment = ethers.utils.parseEther("0.05");

      await expect(
        ticketNFT.connect(addr1).mintTicket(eventId, metadataURI, {
          value: insufficientPayment,
        })
      ).to.be.revertedWith("Insufficient payment");
    });
  });

  describe("Ticket Resale", function () {
    beforeEach(async function () {
      // Create event
      await ticketNFT.createEvent(
        "Resale Event",
        "Event for testing resale",
        ethers.utils.parseEther("0.1"),
        100,
        Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        ethers.utils.parseEther("0.05"),
        ethers.utils.parseEther("0.2"),
        500 // 5%
      );

      // Mint a ticket
      await ticketNFT.connect(addr1).mintTicket(
        1, // eventId
        "ipfs://QmXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZ",
        { value: ethers.utils.parseEther("0.1") }
      );
    });

    it("Should list a ticket for resale", async function () {
      const tokenId = 1;
      const resalePrice = ethers.utils.parseEther("0.15");

      await expect(
        ticketNFT.connect(addr1).listTicketForResale(tokenId, resalePrice)
      )
        .to.emit(ticketNFT, "TicketListed")
        .withArgs(tokenId, resalePrice);

      expect(await ticketNFT.ticketResalePrices(tokenId)).to.equal(resalePrice);
    });

    it("Should buy a resale ticket successfully", async function () {
      const tokenId = 1;
      const resalePrice = ethers.utils.parseEther("0.15");
      
      // List ticket for resale
      await ticketNFT.connect(addr1).listTicketForResale(tokenId, resalePrice);
      
      // Initial balances
      const initialSellerBalance = await addr1.getBalance();
      const initialOrganizerBalance = await owner.getBalance();
      
      // Buy the resale ticket
      await expect(
        ticketNFT.connect(addr2).buyResaleTicket(tokenId, {
          value: resalePrice,
        })
      )
        .to.emit(ticketNFT, "TicketSold")
        .withArgs(tokenId, addr1.address, addr2.address, resalePrice);
      
      // Verify ownership transfer
      expect(await ticketNFT.ownerOf(tokenId)).to.equal(addr2.address);
      
      // Verify resale price reset
      expect(await ticketNFT.ticketResalePrices(tokenId)).to.equal(0);
      
      // Check royalty distribution (not exact due to gas costs)
      const event = await ticketNFT.getEvent(1);
      const royaltyAmount = resalePrice.mul(event.royaltyPercentage).div(10000);
      const sellerProceeds = resalePrice.sub(royaltyAmount);
      
      // We're not checking exact amounts because of gas fees, but the seller
      // should have received roughly the sale price minus royalty
      expect(await addr1.getBalance()).to.be.gt(initialSellerBalance);
      expect(await owner.getBalance()).to.be.gt(initialOrganizerBalance);
    });
  });

  describe("Ticket Validation", function () {
    beforeEach(async function () {
      // Create event
      await ticketNFT.createEvent(
        "Validation Event",
        "Event for testing validation",
        ethers.utils.parseEther("0.1"),
        100,
        Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        ethers.utils.parseEther("0.05"),
        ethers.utils.parseEther("0.2"),
        500 // 5%
      );

      // Mint a ticket
      await ticketNFT.connect(addr1).mintTicket(
        1, // eventId
        "ipfs://QmXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZXZ",
        { value: ethers.utils.parseEther("0.1") }
      );
    });

    it("Should validate a valid ticket", async function () {
      expect(await ticketNFT.isTicketValid(1)).to.equal(true);
    });

    it("Should invalidate ticket after event cancellation", async function () {
      // Cancel the event
      await ticketNFT.cancelEvent(1);
      
      // Ticket should now be invalid
      expect(await ticketNFT.isTicketValid(1)).to.equal(false);
    });
  });
});
