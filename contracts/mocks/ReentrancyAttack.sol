// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../TicketNFT.sol";

error OnlyAttackerAllowed();

contract ReentrancyAttack {
    TicketNFT public targetContract;
    address public attacker;
    uint256 public attackCount;

    constructor(address _targetContract) {
        targetContract = TicketNFT(_targetContract);
        attacker = msg.sender;
    }

    // External function for attack
    function attack(uint256 tokenId) external {
        if (msg.sender != attacker) {
            revert OnlyAttackerAllowed();
        }
        
        // Simulated reentrancy attempt
        attackCount++;
        
        // Avoid low-level calls, use transfer functions when possible
        targetContract.safeTransferFrom(address(this), attacker, tokenId);
    }

    // Receive function called during transfers
    receive() external payable {
        if (address(targetContract).balance > 0) {
            // Attempt another transfer during the call
            this.attack(1);
        }
    }
}