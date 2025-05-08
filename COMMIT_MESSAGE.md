## feat: Implement two-contract architecture for NFT ticketing system

### Summary
This commit refactors the ticketing system into a modular two-contract architecture:
- `EventRegistry` - Dedicated contract for event management
- `EventTicket` - NFT contract for ticket issuance and management

### Changes
- Created `EventRegistry.sol` with event-specific functionality
- Updated `EventTicket.sol` (from `TicketNFT.sol`) to use the registry
- Added interfaces for better modularity
- Created comprehensive test suite for both contracts
- Added integration tests for the full system flow
- Updated README with new architecture details
- Added new scripts for deployment, event creation, and ticket minting

### Benefits
- Better separation of concerns between event and ticket management
- More focused audit scope for each contract
- Simplified upgrade path for individual components
- Improved role management with dedicated permissions
- Direct ticket minting by event organizers without intermediaries

### Testing
- All unit tests pass
- Integration tests verify the end-to-end workflow
- Gas optimization maintained through careful refactoring

### Next Steps
- Update frontend to integrate with the new contract architecture
- Implement ticket tier functionality for different access levels
- Add batch operations for gas-efficient deployments
