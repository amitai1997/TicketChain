import { ethers } from 'hardhat';
import { expect } from 'chai';
import { TicketNFT } from '../../typechain-types/contracts';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('TicketNFT Lifecycle', () => {
  let ticketNFT: TicketNFT;
  // Owner is used for contract deployment

  let owner: HardhatEthersSigner;
  let minter: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;

  beforeEach(async () => {
    const [ownerSigner, minterSigner, buyerSigner] = await ethers.getSigners();
    owner = ownerSigner;
    minter = minterSigner;
    buyer = buyerSigner;

    const TicketNFTFactory = await ethers.getContractFactory('TicketNFT');
    ticketNFT = await TicketNFTFactory.deploy();

    const MINTER_ROLE = await ticketNFT.MINTER_ROLE();
    await ticketNFT.grantRole(MINTER_ROLE, minter.address);
  });

  it('should create ticket with correct metadata', async () => {
    // Get the current block timestamp
    const latestBlock = await ethers.provider.getBlock('latest');
    const blockchainTime = BigInt(latestBlock?.timestamp || Math.floor(Date.now() / 1000));

    const ticketMetadata = {
      eventId: 1,
      price: ethers.parseEther('0.1'),
      validFrom: BigInt(1700000000),
      validUntil: BigInt(1700003600),
      isTransferable: true,
    };

    await ticketNFT
      .connect(minter)
      .mintTicket(
        buyer.address,
        1n,
        ticketMetadata.eventId,
        ticketMetadata.price,
        ticketMetadata.validFrom,
        ticketMetadata.validUntil,
        ticketMetadata.isTransferable
      );

    const fetchedTicket = await ticketNFT.getTicketMetadata(1);
    expect(fetchedTicket.eventId).to.equal(ticketMetadata.eventId);
    expect(fetchedTicket.price).to.equal(ticketMetadata.price);
    expect(fetchedTicket.validFrom).to.equal(ticketMetadata.validFrom);
    expect(fetchedTicket.validUntil).to.equal(ticketMetadata.validUntil);
    expect(fetchedTicket.isTransferable).to.equal(ticketMetadata.isTransferable);
  });

  it('should check ticket validity', async () => {
    // Get the current block timestamp from the blockchain
    const latestBlock = await ethers.provider.getBlock('latest');
    const blockchainTime = BigInt(latestBlock?.timestamp || Math.floor(Date.now() / 1000));

    // Use blockchain time as the base for our ticket timing
    const validFrom = BigInt(blockchainTime) + BigInt(3600); // 1 hour from current blockchain time
    const validUntil = BigInt(blockchainTime) + BigInt(7200); // 2 hours from current blockchain time

    const ticketMetadata = {
      eventId: 1n,
      price: ethers.parseEther('0.5'),
      validFrom,
      validUntil,
      isTransferable: true,
    };

    await ticketNFT
      .connect(minter)
      .mintTicket(
        buyer.address,
        1n,
        ticketMetadata.eventId,
        ticketMetadata.price,
        ticketMetadata.validFrom,
        ticketMetadata.validUntil,
        ticketMetadata.isTransferable
      );

    // Check ticket is currently not valid
    const initialValidity = await ticketNFT.isTicketValid(1);
    expect(initialValidity).to.be.false;

    // Simulate time passing by setting block timestamp to a point between validFrom and validUntil
    const newTimestamp = Number(validFrom) + 100; // Just after validFrom
    await ethers.provider.send('evm_setNextBlockTimestamp', [newTimestamp]);
    await ethers.provider.send('evm_mine');

    // Check ticket validity after time has passed
    const laterValidity = await ticketNFT.isTicketValid(1);
    expect(laterValidity).to.be.true;
  });

  it('should prevent non-transferable ticket transfers', async () => {
    // Get the current block timestamp
    const latestBlock = await ethers.provider.getBlock('latest');
    const blockchainTime = BigInt(latestBlock?.timestamp || Math.floor(Date.now() / 1000));

    const nonTransferableTicketMetadata = {
      eventId: 1n,
      price: ethers.parseEther('0.5'),
      validFrom: BigInt(blockchainTime) + BigInt(3600),
      validUntil: BigInt(blockchainTime) + BigInt(7200),
      isTransferable: false,
    };

    await ticketNFT
      .connect(minter)
      .mintTicket(
        buyer.address,
        1n,
        nonTransferableTicketMetadata.eventId,
        nonTransferableTicketMetadata.price,
        nonTransferableTicketMetadata.validFrom,
        nonTransferableTicketMetadata.validUntil,
        nonTransferableTicketMetadata.isTransferable
      );

    // Try to transfer a non-transferable ticket
    const newOwner = (await ethers.getSigners())[3];
    const transferMethod = 'safeTransferFrom(address,address,uint256)';
    await expect(
      ticketNFT.connect(buyer)[transferMethod](buyer.address, newOwner.address, 1)
      // @ts-ignore: Hardhat Chai matcher
    ).to.be.revertedWithCustomError(ticketNFT, 'TicketNotTransferable');
  });

  it('should prevent minting tickets with invalid time range', async () => {
    // Get the current block timestamp
    const latestBlock = await ethers.provider.getBlock('latest');
    const blockchainTime = BigInt(latestBlock?.timestamp || Math.floor(Date.now() / 1000));

    const invalidTicketMetadata = {
      eventId: 1n,
      price: ethers.parseEther('0.5'),
      validFrom: BigInt(blockchainTime) + BigInt(7200), // Start time after end time
      validUntil: BigInt(blockchainTime) + BigInt(3600),
      isTransferable: true,
    };

    // @ts-ignore: Hardhat Chai matcher
    await expect(
      ticketNFT
        .connect(minter)
        .mintTicket(
          buyer.address,
          1n,
          invalidTicketMetadata.eventId,
          invalidTicketMetadata.price,
          invalidTicketMetadata.validFrom,
          invalidTicketMetadata.validUntil,
          invalidTicketMetadata.isTransferable
        )
    ).to.be.revertedWithCustomError(ticketNFT, 'InvalidTicketTimeRange');
  });

  it('should allow ticket burning by owner', async () => {
    // Get the current block timestamp
    const latestBlock = await ethers.provider.getBlock('latest');
    const blockchainTime = BigInt(latestBlock?.timestamp || Math.floor(Date.now() / 1000));

    const ticketMetadata = {
      eventId: 1n,
      price: ethers.parseEther('0.5'),
      validFrom: BigInt(blockchainTime) + BigInt(3600),
      validUntil: BigInt(blockchainTime) + BigInt(7200),
      isTransferable: true,
    };

    await ticketNFT
      .connect(minter)
      .mintTicket(
        buyer.address,
        1n,
        ticketMetadata.eventId,
        ticketMetadata.price,
        ticketMetadata.validFrom,
        ticketMetadata.validUntil,
        ticketMetadata.isTransferable
      );

    // Burn the ticket
    await ticketNFT.connect(buyer).burn(1);

    // Check that ticket no longer exists
    // @ts-ignore: Hardhat Chai matcher
    await expect(ticketNFT.getTicketMetadata(1)).to.be.revertedWithCustomError(
      ticketNFT,
      'TicketDoesNotExist'
    );
  });
});
