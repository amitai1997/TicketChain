// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../TicketNFT.sol";

contract ReentrancyAttack {
    TicketNFT public targetContract;
    uint256 public attackCount;
    uint256 public constant ATTACK_TOKEN_ID = 9999;

    constructor(address _targetContract) {
        targetContract = TicketNFT(_targetContract);
    }

    function triggerReentrancyAttack() external {
        attackCount = 0;
        
        // Prepare initial ticket metadata
        TicketNFT.TicketMetadata memory metadata = TicketNFT.TicketMetadata({
            eventId: 1,
            price: 0.1 ether,
            validFrom: block.timestamp + 3600,
            validUntil: block.timestamp + 7200,
            isTransferable: true
        });

        // Attempt to trigger reentrancy
        targetContract.mintTicket(address(this), ATTACK_TOKEN_ID, metadata);
    }

    // Fallback function to attempt reentrancy
    receive() external payable {
        if (attackCount < 2) {
            attackCount++;
            
            // Prepare another ticket metadata
            TicketNFT.TicketMetadata memory metadata = TicketNFT.TicketMetadata({
                eventId: 2,
                price: 0.1 ether,
                validFrom: block.timestamp + 3600,
                validUntil: block.timestamp + 7200,
                isTransferable: true
            });

            // Try to mint another ticket while in the receive function
            targetContract.mintTicket(address(this), ATTACK_TOKEN_ID + attackCount, metadata);
        }
    }
}
