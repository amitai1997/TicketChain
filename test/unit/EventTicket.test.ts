import hardhat from 'hardhat';
import { expect } from 'chai';
import { EventRegistry, EventTicket } from '../../typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('EventTicket', () => {
  let eventRegistry: EventRegistry;
  let eventTicket: EventTicket;
  let owner: HardhatEthersSigner;
  let organizer: HardhatEthersSigner;
  let minter: HardhatEthersSigner;
  let attendee: HardhatEthersSigner;
  let eventId: bigint;
  let blockchainTime: bigint;

  beforeEach(async () => {
    const [ownerSigner, organizerSigner, minterSigner, attendeeSigner] = await hardhat.ethers.getSigners();
    owner = ownerSigner;
    organizer = organizerSigner;
    minter = minterSigner;
    attendee = attendeeSigner;

    // Deploy EventRegistry
    const EventRegistryFactory = await hardhat.ethers.getContractFactory('EventRegistry');
    eventRegistry = await EventRegistryFactory.deploy();

    // Deploy EventTicket with EventRegistry address
    const EventTicketFactory = await hardhat.ethers.getContractFactory('EventTicket');
    eventTicket = await EventTicketFactory.deploy(eventRegistry.getAddress());

    // Grant roles
    const EVENT_ORGANIZER_ROLE = await eventRegistry.EVENT_ORGANIZER_ROLE();
    await eventRegistry.grantRole(EVENT_ORGANIZER_ROLE, organizer.address);

    const MINTER_ROLE = await eventTicket.MINTER_ROLE();
    await eventTicket.grantRole(MINTER_ROLE, minter.address);

    // Create an event for testing
    const latestBlock = await hardhat.ethers.provider.getBlock('latest');
    blockchainTime = BigInt(latestBlock?.timestamp || Math.floor(Date.now() / 1000));

    const tx = await eventRegistry
      .connect(organizer)
      .createEvent(
        blockchainTime + 3600n, // 1 hour from blockchain time
        blockchainTime + 14400n, // 4 hours from blockchain time
        'ipfs://QmEvent1'
      );

    // Get event ID from the transaction receipt logs
    const receipt = await tx.wait();
    if (receipt && receipt.logs) {
      // Find the EventCreated event and extract eventId
      const eventCreatedLog = receipt.logs.find(
        (log) => log.topics[0] === hardhat.ethers.id('EventCreated(uint256,address,uint256,uint256,string)')
      );
      
      if (eventCreatedLog) {
        // Extract eventId (first indexed parameter)
        eventId = BigInt(eventCreatedLog.topics[1]);
      } else {
        // Fallback to 1 if log parsing fails
        eventId = 1n;
      }
    } else {
      eventId = 1n;
    }
  });

  describe('Contract Initialization', () => {
    it('should initialize with the correct event registry address', async () => {
      expect(await eventTicket.eventRegistry()).to.equal(await eventRegistry.getAddress());
    });

    it('should allow changing the event registry address by admin', async () => {
      // Deploy a new EventRegistry
      const NewEventRegistryFactory = await hardhat.ethers.getContractFactory('EventRegistry');
      const newEventRegistry = await NewEventRegistryFactory.deploy();

      // Change the event registry address
      await eventTicket.connect(owner).setEventRegistry(await newEventRegistry.getAddress());

      // Check that the address was changed
      expect(await eventTicket.eventRegistry()).to.equal(await newEventRegistry.getAddress());
    });

    it('should not allow non-admins to change the event registry address', async () => {
      await expect(
        eventTicket.connect(attendee).setEventRegistry(attendee.address)
      ).to.be.revertedWithCustomError(eventTicket, 'CannotRenounceAdminRole');
    });
  });

  describe('Ticket Minting', () => {
    it('should mint a ticket with reference to a valid event', async () => {
      const ticketMetadata = {
        eventId,
        price: hardhat.ethers.parseEther('0.5'),
        validFrom: blockchainTime + 4000n, // Within event time range
        validUntil: blockchainTime + 12000n, // Within event time range
        isTransferable: true,
      };

      await expect(
        eventTicket
          .connect(minter)
          .mintTicketForEvent(
            attendee.address,
            ticketMetadata.eventId,
            ticketMetadata.price,
            ticketMetadata.validFrom,
            ticketMetadata.validUntil,
            ticketMetadata.isTransferable
          )
      )
        .to.emit(eventTicket, 'TicketMinted')
        .withArgs(1, eventId, attendee.address, ticketMetadata.price);

      // Verify ticket metadata
      const fetchedTicket = await eventTicket.getTicketMetadata(1);
      expect(fetchedTicket.eventId).to.equal(ticketMetadata.eventId);
      expect(fetchedTicket.price).to.equal(ticketMetadata.price);
      expect(fetchedTicket.validFrom).to.equal(ticketMetadata.validFrom);
      expect(fetchedTicket.validUntil).to.equal(ticketMetadata.validUntil);
      expect(fetchedTicket.isTransferable).to.equal(ticketMetadata.isTransferable);
    });

    it('should fail to mint a ticket for a non-existent event', async () => {
      const nonExistentEventId = 999n;
      await expect(
        eventTicket
          .connect(minter)
          .mintTicketForEvent(
            attendee.address,
            nonExistentEventId,
            hardhat.ethers.parseEther('0.5'),
            blockchainTime + 4000n,
            blockchainTime + 12000n,
            true
          )
      ).to.be.revertedWithCustomError(eventTicket, 'EventDoesNotExistOrInactive');
    });

    it('should fail to mint a ticket for an inactive event', async () => {
      // Deactivate the event
      await eventRegistry.connect(organizer).setEventStatus(eventId, false);

      // Try to mint a ticket for the inactive event
      await expect(
        eventTicket
          .connect(minter)
          .mintTicketForEvent(
            attendee.address,
            eventId,
            hardhat.ethers.parseEther('0.5'),
            blockchainTime + 4000n,
            blockchainTime + 12000n,
            true
          )
      ).to.be.revertedWithCustomError(eventTicket, 'EventDoesNotExistOrInactive');
    });

    it('should fail to mint a ticket with time range outside event time range', async () => {
      // Before event start
      await expect(
        eventTicket
          .connect(minter)
          .mintTicketForEvent(
            attendee.address,
            eventId,
            hardhat.ethers.parseEther('0.5'),
            blockchainTime + 1000n, // Before event start (3600n)
            blockchainTime + 5000n,
            true
          )
      ).to.be.revertedWithCustomError(eventTicket, 'EventTimeConstraintViolation');

      // After event end
      await expect(
        eventTicket
          .connect(minter)
          .mintTicketForEvent(
            attendee.address,
            eventId,
            hardhat.ethers.parseEther('0.5'),
            blockchainTime + 4000n,
            blockchainTime + 18000n, // After event end (14400n)
            true
          )
      ).to.be.revertedWithCustomError(eventTicket, 'EventTimeConstraintViolation');
    });

    it('should allow event organizers to mint tickets for their own events', async () => {
      const ticketMetadata = {
        price: hardhat.ethers.parseEther('0.5'),
        validFrom: blockchainTime + 4000n,
        validUntil: blockchainTime + 12000n,
        isTransferable: true,
      };

      await expect(
        eventTicket
          .connect(organizer)
          .organizerMintTicket(
            attendee.address,
            eventId,
            ticketMetadata.price,
            ticketMetadata.validFrom,
            ticketMetadata.validUntil,
            ticketMetadata.isTransferable
          )
      )
        .to.emit(eventTicket, 'TicketMinted')
        .withArgs(1, eventId, attendee.address, ticketMetadata.price);

      // Verify ticket owner
      expect(await eventTicket.ownerOf(1)).to.equal(attendee.address);
    });

    it('should not allow non-organizers to mint tickets with organizerMintTicket', async () => {
      await expect(
        eventTicket
          .connect(attendee)
          .organizerMintTicket(
            attendee.address,
            eventId,
            hardhat.ethers.parseEther('0.5'),
            blockchainTime + 4000n,
            blockchainTime + 12000n,
            true
          )
      ).to.be.revertedWithCustomError(eventTicket, 'NotEventOrganizer');
    });

    it('should mint multiple tickets in batch', async () => {
      const recipients = [
        attendee.address,
        minter.address,
        organizer.address,
      ];

      const ticketMetadata = {
        price: hardhat.ethers.parseEther('0.5'),
        validFrom: blockchainTime + 4000n,
        validUntil: blockchainTime + 12000n,
        isTransferable: true,
      };

      const tokenIds = await eventTicket
        .connect(minter)
        .batchMintTickets(
          recipients,
          eventId,
          ticketMetadata.price,
          ticketMetadata.validFrom,
          ticketMetadata.validUntil,
          ticketMetadata.isTransferable
        );

      // Verify at least 3 tickets were minted
      expect(await eventTicket.totalSupply()).to.equal(3);

      // Verify owners of tickets
      expect(await eventTicket.ownerOf(1)).to.equal(attendee.address);
      expect(await eventTicket.ownerOf(2)).to.equal(minter.address);
      expect(await eventTicket.ownerOf(3)).to.equal(organizer.address);
    });
  });

  describe('Ticket Validation and Queries', () => {
    beforeEach(async () => {
      // Mint a ticket for testing
      await eventTicket
        .connect(minter)
        .mintTicketForEvent(
          attendee.address,
          eventId,
          hardhat.ethers.parseEther('0.5'),
          blockchainTime + 4000n,
          blockchainTime + 12000n,
          true
        );
    });

    it('should retrieve ticket and event metadata together', async () => {
      const [ticket, event] = await eventTicket.getTicketWithEventMetadata(1);

      // Verify ticket metadata
      expect(ticket.eventId).to.equal(eventId);
      expect(ticket.price).to.equal(hardhat.ethers.parseEther('0.5'));

      // Verify event metadata
      expect(event.organizer).to.equal(organizer.address);
      expect(event.metadataURI).to.equal('ipfs://QmEvent1');
    });

    it('should check if a ticket is valid', async () => {
      // Not yet valid (before validFrom)
      expect(await eventTicket.isTicketValid(1)).to.be.false;

      // Fast forward to within valid period
      const validTimestamp = Number(blockchainTime) + 5000; // Between validFrom and validUntil
      await hardhat.ethers.provider.send('evm_setNextBlockTimestamp', [validTimestamp]);
      await hardhat.ethers.provider.send('evm_mine');

      // Should be valid now
      expect(await eventTicket.isTicketValid(1)).to.be.true;

      // Deactivate the event
      await eventRegistry.connect(organizer).setEventStatus(eventId, false);

      // Should be invalid now due to inactive event
      expect(await eventTicket.isTicketValid(1)).to.be.false;
    });

    it('should retrieve all tickets for an event', async () => {
      // Mint more tickets for the same event
      await eventTicket
        .connect(minter)
        .mintTicketForEvent(
          minter.address,
          eventId,
          hardhat.ethers.parseEther('0.7'),
          blockchainTime + 4000n,
          blockchainTime + 12000n,
          true
        );

      await eventTicket
        .connect(minter)
        .mintTicketForEvent(
          organizer.address,
          eventId,
          hardhat.ethers.parseEther('0.9'),
          blockchainTime + 4000n,
          blockchainTime + 12000n,
          true
        );

      // Get all tickets for the event
      const eventTickets = await eventTicket.getTicketsForEvent(eventId);
      expect(eventTickets.length).to.equal(3);
      expect(eventTickets).to.deep.equal([1n, 2n, 3n]);

      // Create another event
      const tx = await eventRegistry
        .connect(organizer)
        .createEvent(
          blockchainTime + 20000n,
          blockchainTime + 30000n,
          'ipfs://QmEvent2'
        );
      
      const receipt = await tx.wait();
      if (receipt && receipt.logs) {
        const eventCreatedLog = receipt.logs.find(
          (log) => log.topics[0] === hardhat.ethers.id('EventCreated(uint256,address,uint256,uint256,string)')
        );
        
        if (eventCreatedLog) {
          const newEventId = BigInt(eventCreatedLog.topics[1]);
          
          // Mint a ticket for the new event
          await eventTicket
            .connect(minter)
            .mintTicketForEvent(
              attendee.address,
              newEventId,
              hardhat.ethers.parseEther('1.0'),
              blockchainTime + 21000n,
              blockchainTime + 29000n,
              true
            );
          
          // Should be only 3 tickets for the first event still
          const originalEventTickets = await eventTicket.getTicketsForEvent(eventId);
          expect(originalEventTickets.length).to.equal(3);
          
          // Should be 1 ticket for the new event
          const newEventTickets = await eventTicket.getTicketsForEvent(newEventId);
          expect(newEventTickets.length).to.equal(1);
          expect(newEventTickets[0]).to.equal(4n);
        }
      }
    });
  });

  describe('Ticket Transfers', () => {
    beforeEach(async () => {
      // Mint tickets for testing
      await eventTicket
        .connect(minter)
        .mintTicketForEvent(
          attendee.address,
          eventId,
          hardhat.ethers.parseEther('0.5'),
          blockchainTime + 4000n,
          blockchainTime + 12000n,
          true // Transferable
        );

      await eventTicket
        .connect(minter)
        .mintTicketForEvent(
          attendee.address,
          eventId,
          hardhat.ethers.parseEther('0.5'),
          blockchainTime + 4000n,
          blockchainTime + 12000n,
          false // Non-transferable
        );
    });

    it('should allow transferring a transferable ticket', async () => {
      const recipient = organizer.address;
      const transferMethod = 'safeTransferFrom(address,address,uint256)';
      
      await expect(
        eventTicket.connect(attendee)[transferMethod](attendee.address, recipient, 1)
      ).to.not.be.reverted;
      
      // Verify new owner
      expect(await eventTicket.ownerOf(1)).to.equal(recipient);
    });

    it('should prevent transferring a non-transferable ticket', async () => {
      const recipient = organizer.address;
      const transferMethod = 'safeTransferFrom(address,address,uint256)';
      
      await expect(
        eventTicket.connect(attendee)[transferMethod](attendee.address, recipient, 2)
      ).to.be.revertedWithCustomError(eventTicket, 'TicketNotTransferable');
    });

    it('should prevent transfers when contract is paused', async () => {
      // Pause the contract
      await eventTicket.connect(owner).pause();
      
      const recipient = organizer.address;
      const transferMethod = 'safeTransferFrom(address,address,uint256)';
      
      await expect(
        eventTicket.connect(attendee)[transferMethod](attendee.address, recipient, 1)
      ).to.be.reverted; // With "Pausable: paused" error
      
      // Unpause and try again
      await eventTicket.connect(owner).unpause();
      
      await expect(
        eventTicket.connect(attendee)[transferMethod](attendee.address, recipient, 1)
      ).to.not.be.reverted;
      
      // Verify new owner
      expect(await eventTicket.ownerOf(1)).to.equal(recipient);
    });
  });

  describe('Ticket Burning', () => {
    beforeEach(async () => {
      // Mint a ticket for testing
      await eventTicket
        .connect(minter)
        .mintTicketForEvent(
          attendee.address,
          eventId,
          hardhat.ethers.parseEther('0.5'),
          blockchainTime + 4000n,
          blockchainTime + 12000n,
          true
        );
    });

    it('should allow ticket burning by owner', async () => {
      // Burn the ticket
      await eventTicket.connect(attendee).burn(1);

      // Check that ticket no longer exists
      await expect(eventTicket.ownerOf(1)).to.be.reverted; // With "ERC721: invalid token ID"
      await expect(eventTicket.getTicketMetadata(1)).to.be.revertedWithCustomError(
        eventTicket,
        'TicketDoesNotExist'
      );
    });

    it('should clean up metadata and tracking when burning a ticket', async () => {
      // Note the total supply before burning
      expect(await eventTicket.totalSupply()).to.equal(1);
      
      // Burn the ticket
      await eventTicket.connect(attendee).burn(1);
      
      // Check that total supply is updated
      expect(await eventTicket.totalSupply()).to.equal(0);
      
      // Check that the ticket is not in event tickets
      const eventTickets = await eventTicket.getTicketsForEvent(eventId);
      expect(eventTickets.length).to.equal(0);
    });

    it('should not allow burning by non-owners', async () => {
      // Try to burn the ticket as non-owner
      await expect(eventTicket.connect(organizer).burn(1)).to.be.reverted; // With "ERC721: caller is not token owner or approved"
    });
  });

  describe('Integration and Edge Cases', () => {
    it('should correctly handle event deactivation and reactivation', async () => {
      // Mint a ticket
      await eventTicket
        .connect(minter)
        .mintTicketForEvent(
          attendee.address,
          eventId,
          hardhat.ethers.parseEther('0.5'),
          blockchainTime + 4000n,
          blockchainTime + 12000n,
          true
        );
      
      // Fast forward to within valid period
      const validTimestamp = Number(blockchainTime) + 5000;
      await hardhat.ethers.provider.send('evm_setNextBlockTimestamp', [validTimestamp]);
      await hardhat.ethers.provider.send('evm_mine');
      
      // Ticket should be valid
      expect(await eventTicket.isTicketValid(1)).to.be.true;
      
      // Deactivate the event
      await eventRegistry.connect(organizer).setEventStatus(eventId, false);
      
      // Ticket should now be invalid
      expect(await eventTicket.isTicketValid(1)).to.be.false;
      
      // Reactivate the event
      await eventRegistry.connect(organizer).setEventStatus(eventId, true);
      
      // Ticket should be valid again
      expect(await eventTicket.isTicketValid(1)).to.be.true;
    });

    it('should correctly handle ticket creation for multiple events', async () => {
      // Create another event
      const tx = await eventRegistry
        .connect(organizer)
        .createEvent(
          blockchainTime + 20000n,
          blockchainTime + 30000n,
          'ipfs://QmEvent2'
        );
      
      const receipt = await tx.wait();
      if (receipt && receipt.logs) {
        const eventCreatedLog = receipt.logs.find(
          (log) => log.topics[0] === hardhat.ethers.id('EventCreated(uint256,address,uint256,uint256,string)')
        );
        
        if (eventCreatedLog) {
          const newEventId = BigInt(eventCreatedLog.topics[1]);
          
          // Mint tickets for both events
          await eventTicket
            .connect(minter)
            .mintTicketForEvent(
              attendee.address,
              eventId, // First event
              hardhat.ethers.parseEther('0.5'),
              blockchainTime + 4000n,
              blockchainTime + 12000n,
              true
            );
          
          await eventTicket
            .connect(minter)
            .mintTicketForEvent(
              attendee.address,
              newEventId, // Second event
              hardhat.ethers.parseEther('1.0'),
              blockchainTime + 21000n,
              blockchainTime + 29000n,
              true
            );
          
          // Verify ticket metadata for both tickets
          const ticket1 = await eventTicket.getTicketMetadata(1);
          expect(ticket1.eventId).to.equal(eventId);
          
          const ticket2 = await eventTicket.getTicketMetadata(2);
          expect(ticket2.eventId).to.equal(newEventId);
          
          // Get tickets for each event
          const event1Tickets = await eventTicket.getTicketsForEvent(eventId);
          expect(event1Tickets.length).to.equal(1);
          expect(event1Tickets[0]).to.equal(1n);
          
          const event2Tickets = await eventTicket.getTicketsForEvent(newEventId);
          expect(event2Tickets.length).to.equal(1);
          expect(event2Tickets[0]).to.equal(2n);
        }
      }
    });
  });
});
