// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

// Struct defined outside the contract to reduce stack usage
struct TicketMetadata {
    uint256 eventId;
    uint256 price;
    uint256 validFrom;
    uint256 validUntil;
    bool isTransferable;
}

// Custom errors to save gas and improve stack management
error MinterRoleRequired();
error TicketDoesNotExist();
error PauserRoleRequired();
error TicketNotTransferable();
error ContractPaused();
error InvalidTicketTimeRange();
error CannotRenounceAdminRole();

/**
 * @title TicketNFT
 * @dev NFT contract for event tickets with transferability control
 * Optimized for coverage testing by reducing stack depth
 */
contract TicketNFT is ERC721, AccessControl, Pausable, ERC721Burnable {
    // Role identifiers
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Storage for ticket metadata
    mapping(uint256 => TicketMetadata) private _ticketMetadata;
    
    // Simple token tracking for enumeration
    uint256[] private _allTokens;

    constructor() ERC721("TicketChain", "TCKT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
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

    // Token minting with metadata
    function mintTicket(
        address to, 
        uint256 tokenId, 
        uint256 eventId,
        uint256 price,
        uint256 validFrom,
        uint256 validUntil,
        bool isTransferable
    ) public {
        // Split function to reduce stack usage
        _validateAndMint(to, tokenId, eventId, price, validFrom, validUntil, isTransferable);
    }

    // Internal function to validate and mint - split to reduce stack depth
    function _validateAndMint(
        address to,
        uint256 tokenId,
        uint256 eventId,
        uint256 price,
        uint256 validFrom,
        uint256 validUntil,
        bool isTransferable
    ) internal {
        if (!hasRole(MINTER_ROLE, msg.sender)) {
            revert MinterRoleRequired();
        }
        
        if (validFrom >= validUntil) {
            revert InvalidTicketTimeRange();
        }

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
    }

    // Metadata getter
    function getTicketMetadata(uint256 tokenId) public view returns (TicketMetadata memory) {
        if (_ownerOf(tokenId) == address(0)) {
            revert TicketDoesNotExist();
        }
        return _ticketMetadata[tokenId];
    }
    
    // Validity check
    function isTicketValid(uint256 tokenId) public view returns (bool) {
        if (_ownerOf(tokenId) == address(0)) {
            revert TicketDoesNotExist();
        }
        
        TicketMetadata memory metadata = _ticketMetadata[tokenId];
        // solhint-disable-next-line not-rely-on-time
        return block.timestamp >= metadata.validFrom && block.timestamp <= metadata.validUntil;
    }
    
    // Security check for admin role
    function renounceRole(bytes32 role, address account) public override(AccessControl) {
        if (role == DEFAULT_ADMIN_ROLE && account == msg.sender) {
            revert CannotRenounceAdminRole();
        }
        super.renounceRole(role, account);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return ERC721.supportsInterface(interfaceId) || AccessControl.supportsInterface(interfaceId);
    }

    // Basic enumeration
    function totalSupply() public view returns (uint256) {
        return _allTokens.length;
    }
    
    function tokenByIndex(uint256 index) public view returns (uint256) {
        require(index < totalSupply(), "Index out of bounds");
        return _allTokens[index];
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
