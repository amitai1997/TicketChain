import hardhat from "hardhat";
import { expect } from "chai";
import { TicketNFT } from "../../types/typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe('TicketNFT Lifecycle', () => {
  let ticketNFT: TicketNFT;
  let owner: HardhatEthersSigner;
  let minter: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;

  beforeEach(async () => {
    const [ownerSigner, minterSigner, buyerSigner] = await hardhat.ethers.getSigners();
    owner = ownerSigner;
    minter = minterSigner;
    buyer = buyerSigner;

    const TicketNFTFactory = await hardhat.ethers.getContractFactory('TicketNFT');
    ticketNFT = await TicketNFTFactory.deploy();

    const MINTER_ROLE = await ticketNFT.MINTER_ROLE();
    await ticketNFT.grantRole(MINTER_ROLE, minter.address);
  });

  it('should create ticket with correct metadata', async () => {
    const currentTime = Math.floor(Date.now() / 1000);
    const ticketMetadata = {
      eventId: 1,
      price: hardhat.ethers.parseEther('0.5'),
      validFrom: BigInt(currentTime + 3600), // 1 hour from now
      validUntil: BigInt(currentTime + 7200),   // 2 hours from now
      isTransferable: true
    };

    await ticketNFT.connect(minter).mintTicket(buyer.address, 1, ticketMetadata);

    const fetchedTicket = await ticketNFT.getTicketMetadata(1);
    expect(fetchedTicket.eventId).to.equal(ticketMetadata.eventId);
    expect(fetchedTicket.price).to.equal(ticketMetadata.price);
    expect(fetchedTicket.validFrom).to.equal(ticketMetadata.validFrom);
    expect(fetchedTicket.validUntil).to.equal(ticketMetadata.validUntil);
    expect(fetchedTicket.isTransferable).to.equal(ticketMetadata.isTransferable);
  });

  it('should check ticket validity', async () => {
    const currentTime = Math.floor(Date.now() / 1000);
    const ticketMetadata = {
      eventId: 1,
      price: hardhat.ethers.parseEther('0.5'),
      validFrom: BigInt(currentTime + 3600),  // 1 hour from now
      validUntil: BigInt(currentTime + 7200), // 2 hours from now
      isTransferable: true
    };

    await ticketNFT.connect(minter).mintTicket(buyer.address, 1, ticketMetadata);

    // Check ticket is currently not valid
    const initialValidity = await ticketNFT.isTicketValid(1);
    expect(initialValidity).to.be.false;

    // Simulate time passing by setting block timestamp
    await hardhat.ethers.provider.send('evm_setNextBlockTimestamp', [currentTime + 5000]);
    await hardhat.ethers.provider.send('evm_mine');

    // Check ticket validity after time has passed
    const laterValidity = await ticketNFT.isTicketValid(1);
    expect(laterValidity).to.be.false;
  });

  it('should prevent non-transferable ticket transfers', async () => {
    const currentTime = Math.floor(Date.now() / 1000);
    const nonTransferableTicketMetadata = {
      eventId: 1,
      price: hardhat.ethers.parseEther('0.5'),
      validFrom: BigInt(currentTime + 3600),
      validUntil: BigInt(currentTime + 7200),
      isTransferable: false
    };

    await ticketNFT.connect(minter).mintTicket(buyer.address, 1, nonTransferableTicketMetadata);

    const newOwner = (await hardhat.ethers.getSigners())[3];
    await expect(
      ticketNFT.connect(buyer)['safeTransferFrom(address,address,uint256)'](buyer.address, newOwner.address, 1)
    ).to.be.revertedWithCustomError(ticketNFT, 'TicketNotTransferable');
  });

  it('should prevent minting tickets with invalid time range', async () => {
    const currentTime = Math.floor(Date.now() / 1000);
    const invalidTicketMetadata = {
      eventId: 1,
      price: hardhat.ethers.parseEther('0.5'),
      validFrom: BigInt(currentTime + 7200),  // Start time after end time
      validUntil: BigInt(currentTime + 3600),
      isTransferable: true
    };

    await expect(
      ticketNFT.connect(minter).mintTicket(buyer.address, 1, invalidTicketMetadata)
    ).to.be.revertedWithCustomError(ticketNFT, 'InvalidTicketTimeRange');
  });

  it('should allow ticket burning by owner', async () => {
    const currentTime = Math.floor(Date.now() / 1000);
    const ticketMetadata = {
      eventId: 1,
      price: hardhat.ethers.parseEther('0.5'),
      validFrom: BigInt(currentTime + 3600),
      validUntil: BigInt(currentTime + 7200),
      isTransferable: true
    };

    await ticketNFT.connect(minter).mintTicket(buyer.address, 1, ticketMetadata);

    // Burn the ticket
    await ticketNFT.connect(buyer).burn(1);

    // Check that ticket no longer exists
    await expect(
      ticketNFT.getTicketMetadata(1)
    ).to.be.revertedWithCustomError(ticketNFT, 'TicketDoesNotExist');
  });
});
