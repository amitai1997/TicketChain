// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

error EventOrganizerRoleRequired();
error PauserRoleRequired();
error EventDoesNotExist();
error InvalidEventTimeRange();
error CannotRenounceAdminRole();
error NotOrganizerOrAdmin();

/**
 * @title EventRegistry
 * @dev Contract for managing events in the TicketChain platform
 */
contract EventRegistry is AccessControl, Pausable {
    struct EventInfo {
        uint256 id;
        address organizer;
        string name;
        string description;
        string location;
        uint256 startTime;
        uint256 endTime;
        string metadataURI;
        bool canceled;
    }

    bytes32 public constant EVENT_ORGANIZER_ROLE = keccak256("EVENT_ORGANIZER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Counter for event IDs
    uint256 private _nextEventId;

    // Mapping from event IDs to EventInfo
    mapping(uint256 => EventInfo) private _events;

    // Events
    event EventCreated(uint256 indexed eventId, address indexed organizer, string name, uint256 startTime, uint256 endTime);
    event EventCanceled(uint256 indexed eventId);
    event EventUpdated(uint256 indexed eventId);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EVENT_ORGANIZER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function renounceRole(bytes32 role, address account) public virtual override(AccessControl) {
        if (role == DEFAULT_ADMIN_ROLE && account == msg.sender) {
            revert CannotRenounceAdminRole();
        }
        super.renounceRole(role, account);
    }

    function createEvent(
        string memory name,
        string memory description,
        string memory location,
        uint256 startTime,
        uint256 endTime,
        string memory metadataURI
    ) public whenNotPaused onlyRole(EVENT_ORGANIZER_ROLE) returns (uint256) {
        if (startTime >= endTime) {
            revert InvalidEventTimeRange();
        }

        _nextEventId++;
        uint256 eventId = _nextEventId;

        _events[eventId] = EventInfo({
            id: eventId,
            organizer: msg.sender,
            name: name,
            description: description,
            location: location,
            startTime: startTime,
            endTime: endTime,
            metadataURI: metadataURI,
            canceled: false
        });

        emit EventCreated(eventId, msg.sender, name, startTime, endTime);

        return eventId;
    }

    function updateEvent(
        uint256 eventId,
        string memory name,
        string memory description,
        string memory location,
        uint256 startTime,
        uint256 endTime,
        string memory metadataURI
    ) public whenNotPaused onlyRole(EVENT_ORGANIZER_ROLE) {
        if (!_eventExists(eventId)) {
            revert EventDoesNotExist();
        }

        if (startTime >= endTime) {
            revert InvalidEventTimeRange();
        }

        EventInfo storage eventInfo = _events[eventId];
        
        // Only the organizer or admin can update
        if (eventInfo.organizer != msg.sender && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert NotOrganizerOrAdmin();
        }

        eventInfo.name = name;
        eventInfo.description = description;
        eventInfo.location = location;
        eventInfo.startTime = startTime;
        eventInfo.endTime = endTime;
        eventInfo.metadataURI = metadataURI;

        emit EventUpdated(eventId);
    }

    function cancelEvent(uint256 eventId) public whenNotPaused onlyRole(EVENT_ORGANIZER_ROLE) {
        if (!_eventExists(eventId)) {
            revert EventDoesNotExist();
        }

        EventInfo storage eventInfo = _events[eventId];
        
        // Only the organizer or admin can cancel
        if (eventInfo.organizer != msg.sender && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert NotOrganizerOrAdmin();
        }

        eventInfo.canceled = true;

        emit EventCanceled(eventId);
    }

    function getEvent(uint256 eventId) public view returns (EventInfo memory) {
        if (!_eventExists(eventId)) {
            revert EventDoesNotExist();
        }
        return _events[eventId];
    }

    function _eventExists(uint256 eventId) internal view returns (bool) {
        return _events[eventId].id == eventId;
    }
}