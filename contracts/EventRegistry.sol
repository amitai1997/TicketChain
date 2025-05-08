// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from '@openzeppelin/contracts/access/AccessControl.sol';
import {Pausable} from '@openzeppelin/contracts/utils/Pausable.sol';
import {IEventRegistry, EventMetadata} from './interfaces/IEventRegistry.sol';

// Custom errors
error EventOrganizerRoleRequired();
error PauserRoleRequired();
error InvalidEventTimeRange();
error EventDoesNotExist();
error CannotRenounceAdminRole();
error IndexOutOfBounds();

/**
 * @title EventRegistry
 * @dev Contract for managing event registrations
 */
contract EventRegistry is IEventRegistry, AccessControl, Pausable {
  // Role identifiers
  bytes32 public constant EVENT_ORGANIZER_ROLE = keccak256('EVENT_ORGANIZER_ROLE');
  bytes32 public constant PAUSER_ROLE = keccak256('PAUSER_ROLE');

  // Event counter for auto-incrementing IDs
  uint256 private _nextEventId = 1;

  // Storage for event metadata
  mapping(uint256 => EventMetadata) private _eventMetadata;

  // All event IDs for enumeration
  uint256[] private _allEvents;

  // Events
  event EventCreated(
    uint256 indexed eventId,
    address indexed organizer,
    uint256 startTime,
    uint256 endTime,
    string metadataURI
  );
  event EventUpdated(
    uint256 indexed eventId,
    uint256 startTime,
    uint256 endTime,
    string metadataURI
  );
  event EventStatusChanged(uint256 indexed eventId, bool active);

  constructor() {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(EVENT_ORGANIZER_ROLE, msg.sender);
    _grantRole(PAUSER_ROLE, msg.sender);
  }

  // Pause functionalities
  function pause() public {
    if (!hasRole(PAUSER_ROLE, msg.sender)) {
      revert PauserRoleRequired();
    }
    _pause();
  }

  function unpause() public {
    if (!hasRole(PAUSER_ROLE, msg.sender)) {
      revert PauserRoleRequired();
    }
    _unpause();
  }

  /**
   * @dev Creates a new event
   * @param startTime Event start time
   * @param endTime Event end time
   * @param metadataURI URI pointing to event metadata
   * @return eventId ID of the created event
   */
  function createEvent(
    uint256 startTime,
    uint256 endTime,
    string calldata metadataURI
  ) external override whenNotPaused returns (uint256) {
    if (!hasRole(EVENT_ORGANIZER_ROLE, msg.sender)) {
      revert EventOrganizerRoleRequired();
    }

    if (startTime >= endTime) {
      revert InvalidEventTimeRange();
    }

    uint256 eventId = _nextEventId;
    _nextEventId++;

    _eventMetadata[eventId] = EventMetadata({
      organizer: msg.sender,
      startTime: startTime,
      endTime: endTime,
      metadataURI: metadataURI,
      active: true
    });

    _allEvents.push(eventId);

    emit EventCreated(eventId, msg.sender, startTime, endTime, metadataURI);

    return eventId;
  }

  /**
   * @dev Updates an existing event's details
   * Only the organizer can update their events
   */
  function updateEvent(
    uint256 eventId,
    uint256 startTime,
    uint256 endTime,
    string calldata metadataURI
  ) external override whenNotPaused {
    if (!_eventExists(eventId)) {
      revert EventDoesNotExist();
    }

    // Only the organizer or admin can update the event
    if (
      _eventMetadata[eventId].organizer != msg.sender && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)
    ) {
      revert EventOrganizerRoleRequired();
    }

    if (startTime >= endTime) {
      revert InvalidEventTimeRange();
    }

    _eventMetadata[eventId].startTime = startTime;
    _eventMetadata[eventId].endTime = endTime;
    _eventMetadata[eventId].metadataURI = metadataURI;

    emit EventUpdated(eventId, startTime, endTime, metadataURI);
  }

  /**
   * @dev Changes the active status of an event
   * Can be used to temporarily deactivate an event without deleting it
   */
  function setEventStatus(uint256 eventId, bool active) external override whenNotPaused {
    if (!_eventExists(eventId)) {
      revert EventDoesNotExist();
    }

    // Only the organizer or admin can update the event status
    if (
      _eventMetadata[eventId].organizer != msg.sender && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)
    ) {
      revert EventOrganizerRoleRequired();
    }

    _eventMetadata[eventId].active = active;

    emit EventStatusChanged(eventId, active);
  }

  /**
   * @dev Gets an event's metadata
   */
  function getEventMetadata(uint256 eventId) public view override returns (EventMetadata memory) {
    if (!_eventExists(eventId)) {
      revert EventDoesNotExist();
    }
    return _eventMetadata[eventId];
  }

  /**
   * @dev Checks if an event exists
   */
  function _eventExists(uint256 eventId) internal view returns (bool) {
    return _eventMetadata[eventId].organizer != address(0);
  }

  /**
   * @dev Checks if an event is active
   */
  function isEventActive(uint256 eventId) public view override returns (bool) {
    if (!_eventExists(eventId)) {
      revert EventDoesNotExist();
    }
    return _eventMetadata[eventId].active;
  }

  /**
   * @dev Checks if an address is the organizer of a specific event
   */
  function isEventOrganizer(uint256 eventId, address account) public view override returns (bool) {
    if (!_eventExists(eventId)) {
      revert EventDoesNotExist();
    }
    return _eventMetadata[eventId].organizer == account;
  }

  /**
   * @dev Gets the organizer of an event
   */
  function getEventOrganizer(uint256 eventId) public view override returns (address) {
    if (!_eventExists(eventId)) {
      revert EventDoesNotExist();
    }
    return _eventMetadata[eventId].organizer;
  }

  /**
   * @dev Total number of events
   */
  function totalEvents() public view override returns (uint256) {
    return _allEvents.length;
  }

  /**
   * @dev Get event ID by index
   */
  function eventByIndex(uint256 index) public view override returns (uint256) {
    if (index >= totalEvents()) {
      revert IndexOutOfBounds();
    }
    return _allEvents[index];
  }

  /**
   * @dev Security check for admin role
   */
  function renounceRole(bytes32 role, address account) public override(AccessControl) {
    if (role == DEFAULT_ADMIN_ROLE && account == msg.sender) {
      revert CannotRenounceAdminRole();
    }
    super.renounceRole(role, account);
  }
}
