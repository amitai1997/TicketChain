// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {EventMetadata} from './IEventRegistry.sol';

/**
 * @title TicketMetadata
 * @dev Struct to store ticket details
 */
struct TicketMetadata {
  uint256 eventId;
  uint256 price;
  uint256 validFrom;
  uint256 validUntil;
  bool isTransferable;
}
