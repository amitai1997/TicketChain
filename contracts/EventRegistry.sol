// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

error EventOrganizerRoleRequired();
error PauserRoleRequired();
error EventDoesNotExist();
error InvalidEventTimeRange();
error CannotRenounceAdminRole();

/**
 * @title EventRegistry
 * @dev Contract for managing events in the TicketChain platform
 */
contract EventRegistry is AccessControl, Pausable {
    using Counters for Counters.Counter;

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
    Counters.Counter private _eventIdCounter;

    //