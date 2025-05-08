import hardhat from 'hardhat';
import { expect } from 'chai';
import { EventRegistry, EventTicket } from '../../typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('Ticket Trading Integration', () => {
  let eventRegistry: EventRegistry;
  let eventTicket: EventTicket;
  let owner: HardhatEthersSigner;
  let organizer: HardhatEthersSigner;
  let minter: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;
  let secondBuyer: HardhatEthersSigner;
  let blockchainTime: bigint;
  let eventId: bigint;

  beforeEach(async () => {
    const [ownerSigner, organizerSigner, minterSigner, buyerSigner, secondBuyerSigner] =
      await hardhat.ethers.getSigners();
    owner = ownerSigner;
    organizer = organizerSigner;
    minter = minterSigner;
    buyer = buyerSigner;
    secondBuyer = secondBuyerSigner;

    // Deploy contracts
    const EventRegistryFactory = await hardhat.ethers.getContractFactory('EventRegistry');
    eventRegistry = await EventRegistryFactory.deploy();

    const EventTicketFactory = await hardhat.ethers.getContractFactory('EventTicket');
    eventTicket = await EventTicketFactory.deploy(eventRegistry.getAddress());

    // Get the latest block time
    const latestBlock = await hardhat.ethers.provider.getBlock('latest');
    blockchainTime = BigInt(latestBlock?.timestamp || Math.floor(Date.now() / 1000));

    // Grant roles
    const EVENT_ORGANIZER_ROLE = await eventRegistry.EVENT_ORGANIZER_ROLE();
    await eventRegistry.grantRole(EVENT_ORGANIZER_ROLE, organizer.address);

    const MINTER_ROLE = await eventTicket.MINTER_ROLE();
    await eventTicket.grantRole(MINTER_ROLE, minter.address);

    // Create an event
    const createEventTx = await eventRegistry.connect(organizer).createEvent(
      blockchainTime + 86400n, // 1 day from now
      blockchainTime + 172800n, // 2 days from now
      'ipfs://QmEventForTrading'
    );

    const receipt = await createEventTx.wait();
    if (receipt && receipt.logs) {
      const eventCreatedLog = receipt.logs.find(
        (log) =>
          log.topics[0] ===
          hardhat.ethers.id('EventCreated(uint256,address,uint256,uint256,string)')
      );

      if (eventCreatedLog) {
        eventId = BigInt(eventCreatedLog.topics[1]);
      } else {
        eventId = 1n;
      }
    } else {
      eventId = 1n;
    }
  });

  it('should complete a full ticket lifecycle - mint, transfer, and validate', async () => {
    // 1. Create a ticket
    const ticketMetadata = {
      eventId,
      price: hardhat.ethers.parseEther('0.5'),
      validFrom: blockchainTime + 90000n, // During event
      validUntil: blockchainTime + 100000n, // During event
      isTransferable: true,
    };

    // Mint the ticket to the buyer
    await eventTicket
      .connect(minter)
      .mintTicketForEvent(
        buyer.address,
        ticketMetadata.eventId,
        ticketMetadata.price,
        ticketMetadata.validFrom,
        ticketMetadata.validUntil,
        ticketMetadata.isTransferable
      );

    // Verify ownership
    expect(await eventTicket.ownerOf(1)).to.equal(buyer.address);

    // 2. Transfer the ticket to a second buyer
    await eventTicket
      .connect(buyer)
      ['safeTransferFrom(address,address,uint256)'](buyer.address, secondBuyer.address, 1);

    // Verify the new ownership
    expect(await eventTicket.ownerOf(1)).to.equal(secondBuyer.address);

    // 3. Advance time to make the ticket valid
    const validTimestamp = Number(blockchainTime) + 95000; // Between validFrom and validUntil
    await hardhat.ethers.provider.send('evm_setNextBlockTimestamp', [validTimestamp]);
    await hardhat.ethers.provider.send('evm_mine');

    // 4. Verify ticket validity
    const isValid = await eventTicket.isTicketValid(1);
    expect(isValid).to.be.true;

    // 5. Advance time to make the ticket expired
    const expiredTimestamp = Number(blockchainTime) + 105000; // After validUntil
    await hardhat.ethers.provider.send('evm_setNextBlockTimestamp', [expiredTimestamp]);
    await hardhat.ethers.provider.send('evm_mine');

    // 6. Verify ticket is no longer valid
    const isExpired = await eventTicket.isTicketValid(1);
    expect(isExpired).to.be.false;
  });

  it('should handle minting and managing multiple tickets for an event', async () => {
    // Create 3 tickets for the same event
    for (let i = 1; i <= 3; i++) {
      const ticketPrice = hardhat.ethers.parseEther(String(0.5 * i)); // Different prices
      const isTransferable = i % 2 === 0; // Alternating transferability

      await eventTicket
        .connect(minter)
        .mintTicketForEvent(
          buyer.address,
          eventId,
          ticketPrice,
          blockchainTime + 90000n,
          blockchainTime + 100000n,
          isTransferable
        );
    }

    // Verify each ticket has the correct metadata
    for (let i = 1; i <= 3; i++) {
      const ticket = await eventTicket.getTicketMetadata(i);
      expect(ticket.eventId).to.equal(eventId);
      expect(ticket.price).to.equal(hardhat.ethers.parseEther(String(0.5 * i)));
      expect(ticket.isTransferable).to.equal(i % 2 === 0);
    }

    // Try to transfer a non-transferable ticket (should fail)
    const nonTransferableTicketId = 1; // First ticket is non-transferable
    await expect(
      eventTicket
        .connect(buyer)
        [
          'safeTransferFrom(address,address,uint256)'
        ](buyer.address, secondBuyer.address, nonTransferableTicketId)
    ).to.be.revertedWithCustomError(eventTicket, 'TicketNotTransferable');

    // Transfer a transferable ticket (should succeed)
    const transferableTicketId = 2; // Second ticket is transferable
    await eventTicket
      .connect(buyer)
      [
        'safeTransferFrom(address,address,uint256)'
      ](buyer.address, secondBuyer.address, transferableTicketId);

    // Verify the ownership changed
    expect(await eventTicket.ownerOf(transferableTicketId)).to.equal(secondBuyer.address);
  });
});
