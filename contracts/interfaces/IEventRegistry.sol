// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EventMetadata
 * @dev Struct to store event details
 */
struct EventMetadata {
  address organizer;
  uint256 startTime;
  uint256 endTime;
  string metadataURI;
  bool active;
}

/**
 * @title IEventRegistry
 * @dev Interface for the EventRegistry contract
 */
interface IEventRegistry {
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
  ) external returns (uint256);

  /**
   * @dev Updates an existing event's details
   * @param eventId ID of the event to update
   * @param startTime New event start time
   * @param endTime New event end time
   * @param metadataURI New URI pointing to event metadata
   */
  function updateEvent(
    uint256 eventId,
    uint256 startTime,
    uint256 endTime,
    string calldata metadataURI
  ) external;

  /**
   * @dev Sets the active status of an event
   * @param eventId ID of the event to update
   * @param active New active status
   */
  function setEventStatus(uint256 eventId, bool active) external;

  /**
   * @dev Gets an event's metadata
   * @param eventId ID of the event
   * @return EventMetadata struct containing event details
   */
  function getEventMetadata(uint256 eventId) external view returns (EventMetadata memory);

  /**
   * @dev Checks if an event is active
   * @param eventId ID of the event
   * @return bool True if the event is active
   */
  function isEventActive(uint256 eventId) external view returns (bool);

  /**
   * @dev Checks if an address is the organizer of a specific event
   * @param eventId ID of the event
   * @param account Address to check
   * @return bool True if the address is the organizer
   */
  function isEventOrganizer(uint256 eventId, address account) external view returns (bool);

  /**
   * @dev Gets the organizer of an event
   * @param eventId ID of the event
   * @return address The organizer's address
   */
  function getEventOrganizer(uint256 eventId) external view returns (address);

  /**
   * @dev Total number of events
   * @return uint256 The total number of events
   */
  function totalEvents() external view returns (uint256);

  /**
   * @dev Get event ID by index
   * @param index Index in the events array
   * @return uint256 The event ID at the given index
   */
  function eventByIndex(uint256 index) external view returns (uint256);
}
