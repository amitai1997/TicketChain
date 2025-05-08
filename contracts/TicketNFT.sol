// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

/**
 * @title TicketMetadata
 * @dev Struct for storing ticket metadata, moved outside the contract to reduce stack depth
 */
struct TicketMetadata {
    uint256 eventId;
    uint256 price;
    uint256 validFrom;
    uint256 validUntil;
    bool isTransferable;
}

// Custom errors to save gas and reduce stack usage
error MinterRoleRequired();
error TicketDoesNotExist();
error PauserRoleRequired();
error TicketNotTransferable();
error ContractPaused();
error InvalidTicketTimeRange();
error CannotRenounceAdminRole();

/**
 * @title TicketNFT
 * @dev Simplified NFT contract for tickets, avoiding stack too deep errors
 */
contract TicketNFT is ERC721, AccessControl, Pausable, ERC721Burnable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Storage for ticket metadata
    mapping(uint256 => TicketMetadata) private _ticketMetadata;
    
    // Basic enumeration storage - minimized to reduce complexity
    mapping(address => uint256[]) private _ownedTokens;
    uint256[] private _allTokens;

    /**
     * @dev Initializes the contract with roles
     */
    constructor() ERC721("TicketChain", "TCKT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @dev Pauses token transfers
     */
    function pause() public {
        if (!hasRole(PAUSER_ROLE, msg.sender)) {
            revert PauserRoleRequired();
        }
        _pause();
    }

    /**
     * @dev Unpauses token transfers
     */
    function unpause() public {
        if (!hasRole(PAUSER_ROLE, msg.sender)) {
            revert PauserRoleRequired();
        }
        _unpause();
    }

    /**
     * @dev Mints a new ticket NFT
     */
    function mintTicket(address to, uint256 tokenId, TicketMetadata calldata metadata) public {
        if (!hasRole(MINTER_ROLE, msg.sender)) {
            revert MinterRoleRequired();
        }
        
        if (metadata.validFrom >= metadata.validUntil) {
            revert InvalidTicketTimeRange();
        }

        _safeMint(to, tokenId);
        _ticketMetadata[tokenId] = metadata;
        
        // Simplified enumeration tracking
        _ownedTokens[to].push(tokenId);
        _allTokens.push(tokenId);
    }

    /**
     * @dev Gets metadata for a ticket
     */
    function getTicketMetadata(uint256 tokenId) public view returns (TicketMetadata memory) {
        if (_ownerOf(tokenId) == address(0)) {
            revert TicketDoesNotExist();
        }
        return _ticketMetadata[tokenId];
    }
    
    /**
     * @dev Checks if a ticket is temporally valid
     */
    function isTicketValid(uint256 tokenId) public view returns (bool) {
        if (_ownerOf(tokenId) == address(0)) {
            revert TicketDoesNotExist();
        }
        
        TicketMetadata memory metadata = _ticketMetadata[tokenId];
        // solhint-disable-next-line not-rely-on-time
        return block.timestamp >= metadata.validFrom && block.timestamp <= metadata.validUntil;
    }
    
    /**
     * @dev Prevent admin from renouncing their role
     */
    function renounceRole(bytes32 role, address account) public override(AccessControl) {
        if (role == DEFAULT_ADMIN_ROLE && account == msg.sender) {
            revert CannotRenounceAdminRole();
        }
        super.renounceRole(role, account);
    }

    /**
     * @dev Support multiple interface checks
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return ERC721.supportsInterface(interfaceId) || AccessControl.supportsInterface(interfaceId);
    }

    /**
     * @dev Gets tokens owned by a specific address (simple implementation)
     * This is a non-standard implementation that doesn't follow ERC721Enumerable
     * but provides similar functionality with lower complexity
     */
    function tokensOfOwner(address owner) public view returns (uint256[] memory) {
        return _ownedTokens[owner];
    }
    
    /**
     * @dev Gets total supply of tokens
     */
    function totalSupply() public view returns (uint256) {
        return _allTokens.length;
    }
    
    /**
     * @dev Gets all tokens (use with caution as array may grow large)
     */
    function allTokens() public view returns (uint256[] memory) {
        return _allTokens;
    }

    /**
     * @dev Override transfer function to enforce restrictions
     * Simplified implementation to avoid stack too deep errors
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override whenNotPaused returns (address) {
        address from = _ownerOf(tokenId);
        
        // Check if the contract is paused
        if (paused()) {
            revert ContractPaused();
        }
        
        // Only check transferability for actual transfers (not mints or burns)
        if (from != address(0) && to != address(0)) {
            // Check if the ticket is transferable
            if (!_ticketMetadata[tokenId].isTransferable) {
                revert TicketNotTransferable();
            }
        }
        
        // Call parent implementation
        address updatedFrom = super._update(to, tokenId, auth);
        
        // Update the enumeration mappings
        _updateTokenOwnership(updatedFrom, to, tokenId);
        
        return updatedFrom;
    }
    
    /**
     * @dev Updates token ownership in the enumeration mappings
     * Separated from _update to reduce stack usage
     */
    function _updateTokenOwnership(address from, address to, uint256 tokenId) private {
        if (from != address(0)) {
            // Remove from old owner
            _removeTokenFromOwner(from, tokenId);
        }
        
        if (to != address(0)) {
            // Add to new owner
            _ownedTokens[to].push(tokenId);
        } else {
            // Token is being burned, remove from global list
            _removeTokenFromAllTokens(tokenId);
        }
    }
    
    /**
     * @dev Helper to remove a token from the owner's list
     * Simple implementation that doesn't preserve order but avoids stack issues
     */
    function _removeTokenFromOwner(address owner, uint256 tokenId) private {
        uint256[] storage tokens = _ownedTokens[owner];
        uint256 length = tokens.length;
        
        // Find the token
        for (uint256 i = 0; i < length; i++) {
            if (tokens[i] == tokenId) {
                // Replace with the last element and pop (O(1) removal)
                tokens[i] = tokens[length - 1];
                tokens.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Helper to remove a token from the global list
     * Simple implementation that doesn't preserve order but avoids stack issues
     */
    function _removeTokenFromAllTokens(uint256 tokenId) private {
        uint256 length = _allTokens.length;
        
        // Find the token
        for (uint256 i = 0; i < length; i++) {
            if (_allTokens[i] == tokenId) {
                // Replace with the last element and pop (O(1) removal)
                _allTokens[i] = _allTokens[length - 1];
                _allTokens.pop();
                break;
            }
        }
    }
}
