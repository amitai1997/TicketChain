// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import {AccessControl} from '@openzeppelin/contracts/access/AccessControl.sol';
import {Pausable} from '@openzeppelin/contracts/utils/Pausable.sol';
import {ERC721Burnable} from '@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol';
import {IEventRegistry, EventMetadata} from './interfaces/IEventRegistry.sol';
import {TicketMetadata} from './interfaces/IEventTicket.sol';

// Custom errors to save gas and improve stack management
error MinterRoleRequired();
error TicketDoesNotExist();
error PauserRoleRequired();
error TicketNotTransferable();
error ContractPaused();
error InvalidTicketTimeRange();
error CannotRenounceAdminRole();
error IndexOutOfBounds();
error EventDoesNotExistOrInactive();
error NotEventOrganizer();
error EventTimeConstraintViolation();

/**
 * @title EventTicket
 * @dev NFT contract for event tickets with EventRegistry integration
 */
contract EventTicket is ERC721, AccessControl, Pausable, ERC721Burnable {
  // Role identifiers
  bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');
  bytes32 public constant PAUSER_ROLE = keccak256('PAUSER_ROLE');

  // Reference to the event registry contract
  IEventRegistry public eventRegistry;

  // Auto-incrementing counter for ticket IDs
  uint256 private _nextTicketId = 1;

  // Storage for ticket metadata
  mapping(uint256 => TicketMetadata) private _ticketMetadata;

  // Simple token tracking for enumeration
  uint256[] private _allTokens;

  // Event for ticket minting with event reference
  event TicketMinted(
    uint256 indexed tokenId,
    uint256 indexed eventId,
    address indexed receiver,
    uint256 price
  );

  constructor(address eventRegistryAddress) ERC721('EventTicket', 'ETKT') {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(MINTER_ROLE, msg.sender);
    _grantRole(PAUSER_ROLE, msg.sender);

    eventRegistry = IEventRegistry(eventRegistryAddress);
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
   * @dev Set a new event registry address if needed
   * Only callable by admin
   */
  function setEventRegistry(address eventRegistryAddress) external {
    if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
      revert CannotRenounceAdminRole();
    }
    eventRegistry = IEventRegistry(eventRegistryAddress);
  }

  /**
   * @dev Mints a ticket for an event with auto-incrementing ID
   * @param to Recipient address
   * @param eventId ID of the event in the EventRegistry contract
   * @param price Ticket price
   * @param validFrom Timestamp when the ticket becomes valid
   * @param validUntil Timestamp when the ticket expires
   * @param isTransferable Whether the ticket can be transferred
   * @return tokenId The ID of the minted ticket
   */
  function mintTicketForEvent(
    address to,
    uint256 eventId,
    uint256 price,
    uint256 validFrom,
    uint256 validUntil,
    bool isTransferable
  ) public whenNotPaused returns (uint256) {
    if (!hasRole(MINTER_ROLE, msg.sender)) {
      revert MinterRoleRequired();
    }

    // Check that the event exists and is active
    try eventRegistry.isEventActive(eventId) returns (bool isActive) {
      if (!isActive) {
        revert EventDoesNotExistOrInactive();
      }
    } catch {
      revert EventDoesNotExistOrInactive();
    }
    // Get event metadata to validate time constraints
    EventMetadata memory eventData = eventRegistry.getEventMetadata(eventId);

    // Validate ticket time range within event time range
    if (validFrom < eventData.startTime || validUntil > eventData.endTime) {
      revert EventTimeConstraintViolation();
    }

    if (validFrom >= validUntil) {
      revert InvalidTicketTimeRange();
    }

    uint256 tokenId = _nextTicketId;
    _nextTicketId++;

    _safeMint(to, tokenId);

    // Create and store metadata
    TicketMetadata memory metadata = TicketMetadata({
      eventId: eventId,
      price: price,
      validFrom: validFrom,
      validUntil: validUntil,
      isTransferable: isTransferable
    });

    _ticketMetadata[tokenId] = metadata;
    _allTokens.push(tokenId);

    emit TicketMinted(tokenId, eventId, to, price);

    return tokenId;
  }

  /**
   * @dev For event organizers to mint tickets for their events
   * Only the event organizer can mint tickets for their own events
   */
  function organizerMintTicket(
    address to,
    uint256 eventId,
    uint256 price,
    uint256 validFrom,
    uint256 validUntil,
    bool isTransferable
  ) public whenNotPaused returns (uint256) {
    // Check if sender is the event organizer
    try eventRegistry.isEventOrganizer(eventId, msg.sender) returns (bool isOrganizer) {
      if (!isOrganizer) {
        revert NotEventOrganizer();
      }
    } catch {
      revert EventDoesNotExistOrInactive();
    }
    // The organizer can mint tickets for their own events without needing explicit MINTER_ROLE
    // Override the minter role check by calling our own internal implementation
    return _mintOrganizerTicket(to, eventId, price, validFrom, validUntil, isTransferable);
  }

  /**
   * @dev Internal function for organizers to mint tickets
   * Bypasses the MINTER_ROLE check
   */
  function _mintOrganizerTicket(
    address to,
    uint256 eventId,
    uint256 price,
    uint256 validFrom,
    uint256 validUntil,
    bool isTransferable
  ) internal returns (uint256) {
    // Check that the event exists and is active
    try eventRegistry.isEventActive(eventId) returns (bool isActive) {
      if (!isActive) {
        revert EventDoesNotExistOrInactive();
      }
    } catch {
      revert EventDoesNotExistOrInactive();
    }
    // Get event metadata to validate time constraints
    EventMetadata memory eventData = eventRegistry.getEventMetadata(eventId);

    // Validate ticket time range within event time range
    if (validFrom < eventData.startTime || validUntil > eventData.endTime) {
      revert EventTimeConstraintViolation();
    }

    if (validFrom >= validUntil) {
      revert InvalidTicketTimeRange();
    }

    uint256 tokenId = _nextTicketId;
    _nextTicketId++;

    _safeMint(to, tokenId);

    // Create and store metadata
    TicketMetadata memory metadata = TicketMetadata({
      eventId: eventId,
      price: price,
      validFrom: validFrom,
      validUntil: validUntil,
      isTransferable: isTransferable
    });

    _ticketMetadata[tokenId] = metadata;
    _allTokens.push(tokenId);

    emit TicketMinted(tokenId, eventId, to, price);

    return tokenId;
  }

  /**
   * @dev Batch mint multiple tickets for an event
   * @param to Recipients addresses
   * @param eventId ID of the event
   * @param price Ticket price (same for all tickets in batch)
   * @param validFrom Timestamp when tickets become valid
   * @param validUntil Timestamp when tickets expire
   * @param isTransferable Whether tickets can be transferred
   * @return Array of minted ticket IDs
   */
  function batchMintTickets(
    address[] calldata to,
    uint256 eventId,
    uint256 price,
    uint256 validFrom,
    uint256 validUntil,
    bool isTransferable
  ) external whenNotPaused returns (uint256[] memory) {
    if (!hasRole(MINTER_ROLE, msg.sender)) {
      revert MinterRoleRequired();
    }

    uint256[] memory tokenIds = new uint256[](to.length);
    for (uint256 i = 0; i < to.length; i++) {
      tokenIds[i] = mintTicketForEvent(
        to[i],
        eventId,
        price,
        validFrom,
        validUntil,
        isTransferable
      );
    }
    return tokenIds;
  }

  // Metadata getter
  function getTicketMetadata(uint256 tokenId) public view returns (TicketMetadata memory) {
    if (_ownerOf(tokenId) == address(0)) {
      revert TicketDoesNotExist();
    }
    return _ticketMetadata[tokenId];
  }

  /**
   * @dev Get both ticket and related event metadata in one call
   */
  function getTicketWithEventMetadata(
    uint256 tokenId
  ) public view returns (TicketMetadata memory ticket, EventMetadata memory event_) {
    ticket = getTicketMetadata(tokenId);
    event_ = eventRegistry.getEventMetadata(ticket.eventId);
    return (ticket, event_);
  }

  // Validity check
  function isTicketValid(uint256 tokenId) public view returns (bool) {
    if (_ownerOf(tokenId) == address(0)) {
      revert TicketDoesNotExist();
    }

    TicketMetadata memory metadata = _ticketMetadata[tokenId];

    // Check if the associated event is active
    bool eventActive;
    try eventRegistry.isEventActive(metadata.eventId) returns (bool isActive) {
      eventActive = isActive;
    } catch {
      eventActive = false;
    }
    // Check ticket validity time range
    bool ticketInValidTimeRange = (// solhint-disable-next-line not-rely-on-time
    block.timestamp >= metadata.validFrom &&
      // solhint-disable-next-line not-rely-on-time
      block.timestamp <= metadata.validUntil);

    return eventActive && ticketInValidTimeRange;
  }

  // Security check for admin role
  function renounceRole(bytes32 role, address account) public override(AccessControl) {
    if (role == DEFAULT_ADMIN_ROLE && account == msg.sender) {
      revert CannotRenounceAdminRole();
    }
    super.renounceRole(role, account);
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view override(ERC721, AccessControl) returns (bool) {
    return ERC721.supportsInterface(interfaceId) || AccessControl.supportsInterface(interfaceId);
  }

  // Basic enumeration
  function totalSupply() public view returns (uint256) {
    return _allTokens.length;
  }

  function tokenByIndex(uint256 index) public view returns (uint256) {
    if (index >= totalSupply()) {
      revert IndexOutOfBounds();
    }
    return _allTokens[index];
  }

  /**
   * @dev Get all tickets for a specific event
   * @param eventId ID of the event
   * @return Array of ticket IDs for the event
   */
  function getTicketsForEvent(uint256 eventId) public view returns (uint256[] memory) {
    // First, count tickets for this event
    uint256 ticketCount = 0;
    for (uint256 i = 0; i < _allTokens.length; i++) {
      uint256 tokenId = _allTokens[i];
      if (_ticketMetadata[tokenId].eventId == eventId) {
        ticketCount++;
      }
    }

    // Then fill the array
    uint256[] memory eventTickets = new uint256[](ticketCount);
    uint256 index = 0;
    for (uint256 i = 0; i < _allTokens.length; i++) {
      uint256 tokenId = _allTokens[i];
      if (_ticketMetadata[tokenId].eventId == eventId) {
        eventTickets[index] = tokenId;
        index++;
      }
    }

    return eventTickets;
  }

  // Transfer logic - override _update to implement transferability check
  function _update(
    address to,
    uint256 tokenId,
    address auth
  ) internal override whenNotPaused returns (address) {
    // Split logic to reduce stack depth
    bool canTransfer = _checkTransferability(tokenId);
    if (!canTransfer) {
      revert TicketNotTransferable();
    }

    address from = super._update(to, tokenId, auth);

    // If token is being burned, clean up metadata
    if (to == address(0)) {
      delete _ticketMetadata[tokenId];
      _removeTokenFromAllTokens(tokenId);
    }

    return from;
  }

  // Split out transferability check to reduce stack depth
  function _checkTransferability(uint256 tokenId) internal view returns (bool) {
    address from = _ownerOf(tokenId);

    // Minting operations always allowed
    if (from == address(0)) {
      return true;
    }

    // Check if contract is paused
    if (paused()) {
      return false;
    }

    // Check if ticket is transferable
    return _ticketMetadata[tokenId].isTransferable;
  }

  // Helper function to remove token from tracking
  function _removeTokenFromAllTokens(uint256 tokenId) private {
    for (uint256 i = 0; i < _allTokens.length; i++) {
      if (_allTokens[i] == tokenId) {
        // Swap with last element and pop (more gas efficient)
        if (i != _allTokens.length - 1) {
          _allTokens[i] = _allTokens[_allTokens.length - 1];
        }
        _allTokens.pop();
        break;
      }
    }
  }
}
