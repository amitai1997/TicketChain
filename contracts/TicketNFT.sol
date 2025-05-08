// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

error MinterRoleRequired();
error TicketDoesNotExist();
error PauserRoleRequired();
error NonTransferableTicket();
error TicketNotTransferable();
error ContractPaused();
error InvalidTicketTimeRange();
error CannotRenounceAdminRole();

contract TicketNFT is ERC721Enumerable, AccessControl, Pausable, ERC721Burnable {
  struct TicketMetadata {
    uint256 eventId;
    uint256 price;
    uint256 validFrom;
    uint256 validUntil;
    bool isTransferable;
  }

  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
  bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

  mapping(uint256 => TicketMetadata) private _ticketMetadata;

  constructor() ERC721("TicketChain", "TCKT") {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(MINTER_ROLE, msg.sender);
    _grantRole(PAUSER_ROLE, msg.sender);
  }

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

  function mintTicket(address to, uint256 tokenId, TicketMetadata memory metadata) public {
    if (!hasRole(MINTER_ROLE, msg.sender)) {
      revert MinterRoleRequired();
    }
    
    // Check that validFrom is before validUntil
    if (metadata.validFrom >= metadata.validUntil) {
      revert InvalidTicketTimeRange();
    }

    _safeMint(to, tokenId);
    _ticketMetadata[tokenId] = metadata;
  }

  function getTicketMetadata(uint256 tokenId) public view returns (TicketMetadata memory) {
    if (_ownerOf(tokenId) == address(0)) {
      revert TicketDoesNotExist();
    }
    return _ticketMetadata[tokenId];
  }
  
  // Use a block modifier to avoid the not-rely-on-time warning
  function isTicketValid(uint256 tokenId) public view returns (bool) {
    if (_ownerOf(tokenId) == address(0)) {
      revert TicketDoesNotExist();
    }
    
    TicketMetadata memory metadata = _ticketMetadata[tokenId];
    
    // Using block.timestamp with awareness of its limitations
    // solhint-disable-next-line not-rely-on-time
    return block.timestamp >= metadata.validFrom && block.timestamp <= metadata.validUntil;
  }

  function renounceRole(bytes32 role, address account) public virtual override(AccessControl) {
    if (role == DEFAULT_ADMIN_ROLE && account == msg.sender) {
      revert CannotRenounceAdminRole();
    }
    super.renounceRole(role, account);
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view override(ERC721, ERC721Enumerable, AccessControl) returns (bool) {
    return
      ERC721.supportsInterface(interfaceId) ||
      ERC721Enumerable.supportsInterface(interfaceId) ||
      AccessControl.supportsInterface(interfaceId);
  }

  function _increaseBalance(
    address account,
    uint128 amount
  ) internal virtual override(ERC721, ERC721Enumerable) {
    super._increaseBalance(account, amount);
  }

  // Check if the ticket is transferable and not paused
  function _checkTicketTransferability(uint256 tokenId, address from) internal view {
    if (paused()) {
      revert ContractPaused();
    }
    
    // Check ticket transferability only for transfers, not mints or burns
    if (from != address(0)) {
      TicketMetadata storage metadata = _ticketMetadata[tokenId];
      if (!metadata.isTransferable) {
        revert TicketNotTransferable();
      }
    }
  }

  function _update(
    address to,
    uint256 tokenId,
    address auth
  ) internal virtual override(ERC721, ERC721Enumerable) whenNotPaused returns (address) {
    address from = _ownerOf(tokenId);
    
    // Perform ticket transferability check
    _checkTicketTransferability(tokenId, from);

    // Delegate to parent implementation
    return super._update(to, tokenId, auth);
  }
}