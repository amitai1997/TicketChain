// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TicketValidation
 * @dev Library for ticket validation logic to reduce stack depth in main contract
 */
library TicketValidation {
    struct TicketMetadata {
        uint256 eventId;
        uint256 price;
        uint256 validFrom;
        uint256 validUntil;
        bool isTransferable;
    }

    /**
     * @dev Check if a ticket is transferable
     * @param ticketMetadata The mapping of token ID to metadata
     * @param tokenId The ID of the ticket to check
     * @param from The current owner (address(0) for mint operations)
     * @param isPaused Whether the contract is paused
     */
    function checkTicketTransferability(
        mapping(uint256 => TicketMetadata) storage ticketMetadata,
        uint256 tokenId,
        address from,
        bool isPaused
    ) internal view returns (bool) {
        // If the contract is paused, transfers are not allowed
        if (isPaused) {
            return false;
        }
        
        // Minting and burning operations are always allowed
        if (from == address(0)) {
            return true;
        }
        
        // For transfers, check the isTransferable flag
        return ticketMetadata[tokenId].isTransferable;
    }

    /**
     * @dev Check if a ticket is currently valid based on time constraints
     * @param metadata The metadata to check
     */
    function isTicketValidByTime(TicketMetadata memory metadata) internal view returns (bool) {
        // solhint-disable-next-line not-rely-on-time
        return block.timestamp >= metadata.validFrom && block.timestamp <= metadata.validUntil;
    }
}
