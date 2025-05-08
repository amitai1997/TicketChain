import hardhat from 'hardhat';
import { expect } from 'chai';
import { EventRegistry } from '../../typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('EventRegistry', () => {
  let eventRegistry: EventRegistry;
  // Owner is used for contract deployment
  let owner: HardhatEthersSigner;
  let organizer: HardhatEthersSigner;
  let attendee: HardhatEthersSigner;

  beforeEach(async () => {
    const [ownerSigner, organizerSigner, attendeeSigner] = await hardhat.ethers.getSigners();
    owner = ownerSigner;
    organizer = organizerSigner;
    attendee = attendeeSigner;

    const EventRegistryFactory = await hardhat.ethers.getContractFactory('EventRegistry');
    eventRegistry = await EventRegistryFactory.deploy();

    // Grant organizer role to organizer
    const EVENT_ORGANIZER_ROLE = await eventRegistry.EVENT_ORGANIZER_ROLE();
    await eventRegistry.grantRole(EVENT_ORGANIZER_ROLE, organizer.address);
  });

  describe('Event Creation and Management', () => {
    it('should create a new event with correct metadata', async () => {
      // Get the current block timestamp
      const latestBlock = await hardhat.ethers.provider.getBlock('latest');
      const blockchainTime = BigInt(latestBlock?.timestamp || Math.floor(Date.now() / 1000));

      const eventData = {
        startTime: blockchainTime + 3600n, // 1 hour from blockchain time
        endTime: blockchainTime + 7200n, // 2 hours from blockchain time
        metadataURI: 'ipfs://QmEvent1',
      };

      // Create event as organizer
      await expect(
        eventRegistry
          .connect(organizer)
          .createEvent(eventData.startTime, eventData.endTime, eventData.metadataURI)
      )
        .to.emit(eventRegistry, 'EventCreated')
        .withArgs(
          1, // Event ID (first event)
          organizer.address,
          eventData.startTime,
          eventData.endTime,
          eventData.metadataURI
        );

      // Verify event metadata
      const createdEvent = await eventRegistry.getEventMetadata(1);
      expect(createdEvent.organizer).to.equal(organizer.address);
      expect(createdEvent.startTime).to.equal(eventData.startTime);
      expect(createdEvent.endTime).to.equal(eventData.endTime);
      expect(createdEvent.metadataURI).to.equal(eventData.metadataURI);
      expect(createdEvent.active).to.be.true;
    });

    it('should prevent non-organizers from creating events', async () => {
      const latestBlock = await hardhat.ethers.provider.getBlock('latest');
      const blockchainTime = BigInt(latestBlock?.timestamp || Math.floor(Date.now() / 1000));

      // Try to create event as non-organizer
      await expect(
        eventRegistry
          .connect(attendee)
          .createEvent(blockchainTime + 3600n, blockchainTime + 7200n, 'ipfs://QmEvent1')
      ).to.be.revertedWithCustomError(eventRegistry, 'EventOrganizerRoleRequired');
    });

    it('should prevent creating events with invalid time range', async () => {
      const latestBlock = await hardhat.ethers.provider.getBlock('latest');
      const blockchainTime = BigInt(latestBlock?.timestamp || Math.floor(Date.now() / 1000));

      // End time before start time
      await expect(
        eventRegistry.connect(organizer).createEvent(
          blockchainTime + 7200n, // 2 hours from blockchain time (start)
          blockchainTime + 3600n, // 1 hour from blockchain time (end)
          'ipfs://QmEvent1'
        )
      ).to.be.revertedWithCustomError(eventRegistry, 'InvalidEventTimeRange');

      // End time equal to start time
      await expect(
        eventRegistry.connect(organizer).createEvent(
          blockchainTime + 3600n, // 1 hour from blockchain time
          blockchainTime + 3600n, // Same as start time
          'ipfs://QmEvent1'
        )
      ).to.be.revertedWithCustomError(eventRegistry, 'InvalidEventTimeRange');
    });

    it('should allow updating an event by its organizer', async () => {
      const latestBlock = await hardhat.ethers.provider.getBlock('latest');
      const blockchainTime = BigInt(latestBlock?.timestamp || Math.floor(Date.now() / 1000));

      // Create event first
      await eventRegistry
        .connect(organizer)
        .createEvent(blockchainTime + 3600n, blockchainTime + 7200n, 'ipfs://QmEvent1');

      // Update the event
      const updatedEventData = {
        startTime: blockchainTime + 4000n,
        endTime: blockchainTime + 8000n,
        metadataURI: 'ipfs://QmEvent1Updated',
      };

      await expect(
        eventRegistry.connect(organizer).updateEvent(
          1, // First event ID
          updatedEventData.startTime,
          updatedEventData.endTime,
          updatedEventData.metadataURI
        )
      )
        .to.emit(eventRegistry, 'EventUpdated')
        .withArgs(
          1,
          updatedEventData.startTime,
          updatedEventData.endTime,
          updatedEventData.metadataURI
        );

      // Verify updated event metadata
      const updatedEvent = await eventRegistry.getEventMetadata(1);
      expect(updatedEvent.startTime).to.equal(updatedEventData.startTime);
      expect(updatedEvent.endTime).to.equal(updatedEventData.endTime);
      expect(updatedEvent.metadataURI).to.equal(updatedEventData.metadataURI);
      // Organizer should remain the same
      expect(updatedEvent.organizer).to.equal(organizer.address);
    });

    it('should prevent non-organizers from updating events', async () => {
      const latestBlock = await hardhat.ethers.provider.getBlock('latest');
      const blockchainTime = BigInt(latestBlock?.timestamp || Math.floor(Date.now() / 1000));

      // Create event first
      await eventRegistry
        .connect(organizer)
        .createEvent(blockchainTime + 3600n, blockchainTime + 7200n, 'ipfs://QmEvent1');

      // Try to update the event as non-organizer
      await expect(
        eventRegistry.connect(attendee).updateEvent(
          1, // First event ID
          blockchainTime + 4000n,
          blockchainTime + 8000n,
          'ipfs://QmEvent1Updated'
        )
      ).to.be.revertedWithCustomError(eventRegistry, 'EventOrganizerRoleRequired');
    });

    it('should allow changing event status', async () => {
      const latestBlock = await hardhat.ethers.provider.getBlock('latest');
      const blockchainTime = BigInt(latestBlock?.timestamp || Math.floor(Date.now() / 1000));

      // Create event first
      await eventRegistry
        .connect(organizer)
        .createEvent(blockchainTime + 3600n, blockchainTime + 7200n, 'ipfs://QmEvent1');

      // Deactivate the event
      await expect(eventRegistry.connect(organizer).setEventStatus(1, false))
        .to.emit(eventRegistry, 'EventStatusChanged')
        .withArgs(1, false);

      // Verify event status
      const event = await eventRegistry.getEventMetadata(1);
      expect(event.active).to.be.false;

      // Reactivate the event
      await expect(eventRegistry.connect(organizer).setEventStatus(1, true))
        .to.emit(eventRegistry, 'EventStatusChanged')
        .withArgs(1, true);

      // Verify event status
      const reactivatedEvent = await eventRegistry.getEventMetadata(1);
      expect(reactivatedEvent.active).to.be.true;
    });

    it('should prevent non-organizers from changing event status', async () => {
      const latestBlock = await hardhat.ethers.provider.getBlock('latest');
      const blockchainTime = BigInt(latestBlock?.timestamp || Math.floor(Date.now() / 1000));

      // Create event first
      await eventRegistry
        .connect(organizer)
        .createEvent(blockchainTime + 3600n, blockchainTime + 7200n, 'ipfs://QmEvent1');

      // Try to change status as non-organizer
      await expect(
        eventRegistry.connect(attendee).setEventStatus(1, false)
      ).to.be.revertedWithCustomError(eventRegistry, 'EventOrganizerRoleRequired');
    });
  });

  describe('Event Queries', () => {
    beforeEach(async () => {
      // Create events for testing queries
      const latestBlock = await hardhat.ethers.provider.getBlock('latest');
      const blockchainTime = BigInt(latestBlock?.timestamp || Math.floor(Date.now() / 1000));

      // Create multiple events
      await eventRegistry
        .connect(organizer)
        .createEvent(blockchainTime + 3600n, blockchainTime + 7200n, 'ipfs://QmEvent1');

      await eventRegistry.connect(organizer).createEvent(
        blockchainTime + 10800n, // 3 hours from blockchain time
        blockchainTime + 14400n, // 4 hours from blockchain time
        'ipfs://QmEvent2'
      );
    });

    it('should correctly retrieve event metadata', async () => {
      const event = await eventRegistry.getEventMetadata(1);
      expect(event.organizer).to.equal(organizer.address);
      expect(event.metadataURI).to.equal('ipfs://QmEvent1');
    });

    it('should correctly check if an event is active', async () => {
      // Initially, all events are active
      expect(await eventRegistry.isEventActive(1)).to.be.true;

      // Deactivate event 1
      await eventRegistry.connect(organizer).setEventStatus(1, false);
      expect(await eventRegistry.isEventActive(1)).to.be.false;
    });

    it('should correctly check if an address is the event organizer', async () => {
      // Organizer should be the event organizer
      expect(await eventRegistry.isEventOrganizer(1, organizer.address)).to.be.true;

      // Attendee should not be the event organizer
      expect(await eventRegistry.isEventOrganizer(1, attendee.address)).to.be.false;
    });

    it('should correctly return the event organizer', async () => {
      expect(await eventRegistry.getEventOrganizer(1)).to.equal(organizer.address);
    });

    it('should correctly report the total number of events', async () => {
      expect(await eventRegistry.totalEvents()).to.equal(2);
    });

    it('should correctly retrieve event by index', async () => {
      expect(await eventRegistry.eventByIndex(0)).to.equal(1); // First event ID
      expect(await eventRegistry.eventByIndex(1)).to.equal(2); // Second event ID
    });

    it('should revert when accessing non-existent events', async () => {
      // Try to get non-existent event
      await expect(eventRegistry.getEventMetadata(999)).to.be.revertedWithCustomError(
        eventRegistry,
        'EventDoesNotExist'
      );

      // Try to access event by out-of-bounds index
      await expect(eventRegistry.eventByIndex(999)).to.be.revertedWithCustomError(
        eventRegistry,
        'IndexOutOfBounds'
      );
    });
  });

  describe('Pause functionality', () => {
    it('should allow pausing and unpausing by pauser', async () => {
      // Pause the contract
      await eventRegistry.connect(owner).pause();

      const latestBlock = await hardhat.ethers.provider.getBlock('latest');
      const blockchainTime = BigInt(latestBlock?.timestamp || Math.floor(Date.now() / 1000));

      // Try to create event while paused
      await expect(
        eventRegistry
          .connect(organizer)
          .createEvent(blockchainTime + 3600n, blockchainTime + 7200n, 'ipfs://QmEvent1')
      ).to.be.reverted; // With "Pausable: paused" error

      // Unpause the contract
      await eventRegistry.connect(owner).unpause();

      // Should work now
      await expect(
        eventRegistry
          .connect(organizer)
          .createEvent(blockchainTime + 3600n, blockchainTime + 7200n, 'ipfs://QmEvent1')
      ).to.not.be.reverted;
    });

    it('should prevent non-pausers from pausing/unpausing', async () => {
      // Try to pause as non-pauser
      await expect(eventRegistry.connect(attendee).pause()).to.be.revertedWithCustomError(
        eventRegistry,
        'PauserRoleRequired'
      );

      // Pause with authorized account
      await eventRegistry.connect(owner).pause();

      // Try to unpause as non-pauser
      await expect(eventRegistry.connect(attendee).unpause()).to.be.revertedWithCustomError(
        eventRegistry,
        'PauserRoleRequired'
      );
    });
  });

  describe('Security', () => {
    it('should prevent renouncing admin role', async () => {
      const DEFAULT_ADMIN_ROLE = await eventRegistry.DEFAULT_ADMIN_ROLE();
      await expect(
        eventRegistry.connect(owner).renounceRole(DEFAULT_ADMIN_ROLE, owner.address)
      ).to.be.revertedWithCustomError(eventRegistry, 'CannotRenounceAdminRole');
    });
  });
});
