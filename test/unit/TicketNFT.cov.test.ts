import { expect } from "chai";
import hre from "hardhat";
import type { TicketNFT } from "../../typechain-types/contracts/TicketNFT";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

// Import custom matchers
import "@nomicfoundation/hardhat-chai-matchers";

// Simplified test for coverage
describe("TicketNFT Coverage Test", function () {
  let ticketNFT: any; // Use any to avoid TypeScript errors
  let owner: SignerWithAddress;
  let minter: SignerWithAddress;
  let pauser: SignerWithAddress;
  let buyer: SignerWithAddress;
  
  // Constants for ticket creation
  const TOKEN_ID = 1;
  const EVENT_ID = 1;
  const PRICE = hre.ethers.parseEther("0.1");
  const VALID_FROM = Math.floor(Date.now() / 1000); // now
  const VALID_UNTIL = VALID_FROM + 86400; // 1 day later
  const IS_TRANSFERABLE = true;

  beforeEach(async function () {
    [owner, minter, pauser, buyer] = await hre.ethers.getSigners();
    
    // Deploy the contract
    const TicketNFTFactory = await hre.ethers.getContractFactory("TicketNFT");
    ticketNFT = await TicketNFTFactory.deploy();
    
    // Grant roles
    const MINTER_ROLE = await ticketNFT.MINTER_ROLE();
    const PAUSER_ROLE = await ticketNFT.PAUSER_ROLE();
    await ticketNFT.grantRole(MINTER_ROLE, minter.address);
    await ticketNFT.grantRole(PAUSER_ROLE, pauser.address);
  });

  describe("Deployment", function () {
    it("should set the correct roles", async function () {
      const DEFAULT_ADMIN_ROLE = await ticketNFT.DEFAULT_ADMIN_ROLE();
      const MINTER_ROLE = await ticketNFT.MINTER_ROLE();
      const PAUSER_ROLE = await ticketNFT.PAUSER_ROLE();
      
      expect(await ticketNFT.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await ticketNFT.hasRole(MINTER_ROLE, minter.address)).to.be.true;
      expect(await ticketNFT.hasRole(PAUSER_ROLE, pauser.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("should mint a ticket with correct metadata", async function () {
      await ticketNFT.connect(minter).mintTicket(
        buyer.address,
        TOKEN_ID,
        EVENT_ID,
        PRICE,
        VALID_FROM,
        VALID_UNTIL,
        IS_TRANSFERABLE
      );
      
      const metadata = await ticketNFT.getTicketMetadata(TOKEN_ID);
      
      expect(metadata.eventId).to.equal(EVENT_ID);
      expect(metadata.price).to.equal(PRICE);
      expect(metadata.validFrom).to.equal(VALID_FROM);
      expect(metadata.validUntil).to.equal(VALID_UNTIL);
      expect(metadata.isTransferable).to.equal(IS_TRANSFERABLE);
      expect(await ticketNFT.ownerOf(TOKEN_ID)).to.equal(buyer.address);
    });
    
    it("should revert when minted by non-minter", async function () {
      await expect(
        ticketNFT.connect(buyer).mintTicket(
          buyer.address,
          TOKEN_ID,
          EVENT_ID,
          PRICE,
          VALID_FROM,
          VALID_UNTIL,
          IS_TRANSFERABLE
        )
      ).to.be.reverted;
    });
    
    it("should revert when validFrom is after validUntil", async function () {
      await expect(
        ticketNFT.connect(minter).mintTicket(
          buyer.address,
          TOKEN_ID,
          EVENT_ID,
          PRICE,
          VALID_UNTIL, // Swapped
          VALID_FROM,  // Swapped
          IS_TRANSFERABLE
        )
      ).to.be.reverted;
    });
  });

  describe("Pausing", function () {
    it("should pause and unpause the contract", async function () {
      await ticketNFT.connect(pauser).pause();
      expect(await ticketNFT.paused()).to.be.true;
      
      await ticketNFT.connect(pauser).unpause();
      expect(await ticketNFT.paused()).to.be.false;
    });
    
    it("should revert when paused by non-pauser", async function () {
      await expect(
        ticketNFT.connect(buyer).pause()
      ).to.be.reverted;
    });
    
    it("should revert when unpaused by non-pauser", async function () {
      await ticketNFT.connect(pauser).pause();
      await expect(
        ticketNFT.connect(buyer).unpause()
      ).to.be.reverted;
    });
  });
  
  describe("Ticket Validation", function () {
    beforeEach(async function () {
      await ticketNFT.connect(minter).mintTicket(
        buyer.address,
        TOKEN_ID,
        EVENT_ID,
        PRICE,
        VALID_FROM,
        VALID_UNTIL,
        IS_TRANSFERABLE
      );
    });
    
    it("should validate ticket time validity", async function () {
      expect(await ticketNFT.isTicketValid(TOKEN_ID)).to.be.true;
    });
    
    it("should revert for non-existent tickets", async function () {
      await expect(
        ticketNFT.getTicketMetadata(999)
      ).to.be.reverted;
      
      await expect(
        ticketNFT.isTicketValid(999)
      ).to.be.reverted;
    });
  });
  
  describe("Enumeration", function () {
    beforeEach(async function () {
      await ticketNFT.connect(minter).mintTicket(
        buyer.address,
        TOKEN_ID,
        EVENT_ID,
        PRICE,
        VALID_FROM,
        VALID_UNTIL,
        IS_TRANSFERABLE
      );
    });
    
    it("should track total supply", async function () {
      expect(await ticketNFT.totalSupply()).to.equal(1);
    });
    
    it("should allow access by index", async function () {
      expect(await ticketNFT.tokenByIndex(0)).to.equal(TOKEN_ID);
    });
  });
  
  describe("Transferability", function () {
    beforeEach(async function () {
      // Mint a transferable ticket
      await ticketNFT.connect(minter).mintTicket(
        buyer.address,
        TOKEN_ID,
        EVENT_ID,
        PRICE,
        VALID_FROM,
        VALID_UNTIL,
        true
      );
      
      // Mint a non-transferable ticket
      await ticketNFT.connect(minter).mintTicket(
        buyer.address,
        TOKEN_ID + 1,
        EVENT_ID,
        PRICE,
        VALID_FROM,
        VALID_UNTIL,
        false
      );
    });
    
    it("should allow transfer of transferable tickets", async function () {
      await ticketNFT.connect(buyer).transferFrom(buyer.address, owner.address, TOKEN_ID);
      expect(await ticketNFT.ownerOf(TOKEN_ID)).to.equal(owner.address);
    });
    
    it("should prevent transfer of non-transferable tickets", async function () {
      await expect(
        ticketNFT.connect(buyer).transferFrom(buyer.address, owner.address, TOKEN_ID + 1)
      ).to.be.reverted;
    });
    
    it("should prevent transfers when paused", async function () {
      await ticketNFT.connect(pauser).pause();
      
      // Use a more generic assertion
      await expect(
        ticketNFT.connect(buyer).transferFrom(buyer.address, owner.address, TOKEN_ID)
      ).to.be.reverted;
    });
  });
});
