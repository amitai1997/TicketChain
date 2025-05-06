// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {
  ERC721Enumerable
} from '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import {AccessControl} from '@openzeppelin/contracts/access/AccessControl.sol';
import {Pausable} from '@openzeppelin/contracts/utils/Pausable.sol';
import {ERC721Burnable} from '@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol';

error MinterRoleRequired();
error TicketDoesNotExist();
error PauserRoleRequired();
error NonTransferableTicket();

contract TicketNFT is ERC721Enumerable, AccessControl, Pausable, ERC721Burnable {
  struct TicketMetadata {
    uint256 eventId;
    uint256 price;
    uint256 validFrom;
    uint256 validUntil;
    bool isTransferable;
  }

  bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');
  bytes32 public constant PAUSER_ROLE = keccak256('PAUSER_ROLE');

  mapping(uint256 => TicketMetadata) private _ticketMetadata;

  constructor() ERC721("TicketChain", "TCKT") {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _setupRole(MINTER_ROLE, msg.sender);
    _setupRole(PAUSER_ROLE, msg.sender);
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

    _safeMint(to, tokenId);
    _ticketMetadata[tokenId] = metadata;
  }

  function getTicketMetadata(uint256 tokenId) public view returns (TicketMetadata memory) {
    if (!_exists(tokenId)) {
      revert TicketDoesNotExist();
    }
    return _ticketMetadata[tokenId];
  }

  function renounceRole(bytes32 role, address account) public virtual override(AccessControl) {
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

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId,
    uint256 batchSize
  ) internal virtual override(ERC721, ERC721Enumerable) whenNotPaused {
    // Check ticket transferability
    if (from != address(0)) {
      TicketMetadata storage metadata = _ticketMetadata[tokenId];
      if (!metadata.isTransferable) {
        revert NonTransferableTicket();
      }
    }

    super._beforeTokenTransfer(from, to, tokenId, batchSize);
  }
}
