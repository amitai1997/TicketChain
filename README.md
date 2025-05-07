# TicketChain 🎟️

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity Version](https://img.shields.io/badge/Solidity-v0.8.20-blue)](https://soliditylang.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/yourusername/ticketchain)

A blockchain-based NFT ticketing system built on Ethereum.

## Table of Contents

- [Overview](#overview)
- [Architecture Diagram](#architecture-diagram)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [Deployment](#deployment)
- [Configuration Reference](#configuration-reference)
- [Contributing Guide](#contributing-guide)
- [Roadmap & Planned Features](#roadmap--planned-features)
- [Known Issues / Limitations](#known-issues--limitations)
- [License](#license)
- [Acknowledgments & References](#acknowledgments--references)
- [Contact & Community](#contact--community)

## Overview

TicketChain revolutionizes event ticketing by providing a secure, transparent, and decentralized platform powered by blockchain technology. Each ticket is represented as a unique NFT (Non-Fungible Token) on the Ethereum blockchain, ensuring authenticity and eliminating counterfeiting.

### Key Features:

- **Secure Ticket Issuance** - Create tamper-proof digital tickets with customizable metadata
- **Verified Resale Market** - Control secondary market transfers with royalty schemes
- **Time-Based Validity** - Built-in mechanisms for ticket validation timeframes
- **Access Control** - Granular permission system for event organizers
- **Transparent Ownership** - Clear history of ticket ownership and transfers
- **Anti-Scalping Measures** - Price caps and transfer limitations

## Architecture Diagram

```mermaid
graph TD
    A[Event Organizer] -->|Deploy Contract| B[TicketNFT Contract]
    B -->|Issue Tickets| C[Primary Market]
    C -->|Purchase| D[Ticket Holder]
    D -->|Transfer/Sell| E[Secondary Market]
    E -->|Buy| F[New Ticket Holder]
    F -->|Redeem| G[Event Entry]

    subgraph Blockchain
    B
    end

    subgraph TicketChain System
    C
    E
    end

    B -->|Verify| G
```

## Tech Stack

- **Solidity (v0.8.20)** - Smart contract language offering security features and EVM compatibility essential for ticket NFT implementation.
- **OpenZeppelin Contracts** - Provides security-audited contract implementations for access control, tokens, and pausability to reduce vulnerability risks.
- **Hardhat** - Ethereum development environment with debugging, network management, and testing tools that streamline the development workflow.
- **Ethers.js** - JavaScript library for interacting with the Ethereum blockchain, chosen for its comprehensive API and Promise-based interface.
- **Chai/Mocha** - Testing frameworks that enable robust contract testing with readable assertions and organized test suites.
- **pnpm** - Fast, disk space efficient package manager used for managing the project's dependencies.

## Quick Start

Get TicketChain running locally in minutes:

```bash
# Clone the repository
git clone https://github.com/yourusername/ticketchain.git
cd ticketchain

# Install dependencies
pnpm install

# Compile contracts
pnpm compile

# Deploy and mint tickets in one step (NEW!)
pnpm mint:dev
```

### Alternative Setup

```bash
# Start a local Ethereum node
pnpm hardhat node

# Deploy contracts to the local network (in a new terminal)
pnpm deploy:local

# Mint a test ticket
pnpm mint --network localhost
```

### Docker Quick Start

```bash
# Build and run with Docker
docker build -t ticketchain .
docker run -p 8545:8545 ticketchain
```

## Detailed Setup

### Prerequisites

- Node.js >= 16.x (v18.x recommended for best compatibility)
- pnpm >= 8.x
- Git

### Environment Configuration

Create a `.env` file in the project root based on the provided `.env.example`:

```
# File: .env
INFURA_API_KEY=your_infura_api_key
PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
CONTRACT_ADDRESS=0x123...  # Only needed for script execution on testnets/mainnet
```

### Network Configuration

TicketChain supports multiple Ethereum networks. Default configuration is in `hardhat.config.ts`:

```typescript
// File: hardhat.config.ts
const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      viaIR: !isCoverage,
      optimizer: {
        enabled: true,
        runs: 200,
      },
      debug: {
        revertStrings: 'strip',
      },
    },
  },
  networks: {
    // Local development
    hardhat: {
      chainId: 1337,
      allowUnlimitedContractSize: true,
    },
  },
  // Other configurations...
};
```

### Contract Compilation

```bash
pnpm compile
```

## Usage Examples

### Example 1: Deploy and Mint in One Step (NEW!)

Our new streamlined development workflow allows you to deploy and mint tickets in a single command:

```bash
# Deploy contract, set up roles, and mint 3 tickets with different properties
pnpm mint:dev
```

**Expected Result:** Contract deployed and 3 tickets minted with varied properties (transferable and non-transferable tickets, different prices, etc.)

### Example 2: Deploy the Ticketing Contract

```bash
# Deploy to local Hardhat network (NEW!)
pnpm deploy:dev

# Deploy to running local node
pnpm deploy:local

# Deploy to Sepolia testnet
pnpm deploy:testnet
```

**Expected Result:** Contract address displayed in terminal and saved to `deployments/{network}-deployment.json`

### Example 3: Mint a New Ticket

```bash
# Create tickets with saved deployment information
pnpm mint
```

**Expected Result:** Ticket minted with specified metadata (event ID, price, validity period, etc.)

### Example 4: Transfer a Ticket

```typescript
// File: scripts/transfer-ticket.js
const ticketId = 1;
const recipientAddress = '0xRecipientAddressHere';
const tx = await ticketNFT
  .connect(ticketOwner)
  ['safeTransferFrom(address,address,uint256)'](ticketOwner.address, recipientAddress, ticketId);
await tx.wait();
```

**Expected Result:** Ticket ownership transferred to recipient (transaction hash displayed)

## Testing

TicketChain includes comprehensive tests for all core functionality.

### Running the Test Suite

```bash
# Run unit tests
pnpm test

# Run integration tests (NEW!)
pnpm test:integration

# Run all tests
pnpm test:all

# Run tests with gas reporting
pnpm test:gas

# Run test coverage analysis
pnpm test:coverage
```

### Test Structure

- `test/unit/AccessControl.test.ts` - Tests for role-based permissions
- `test/unit/SecurityAndPausability.test.ts` - Tests for pausing functionality
- `test/unit/TicketLifecycle.test.ts` - Tests for ticket creation, validation, and transfer
- `test/integration/TicketTrading.integration.test.ts` - Integration tests for complete ticket lifecycle and multiple ticket management (NEW!)

## Deployment

### Local Development Deployment (NEW!)

For rapid local development, we now offer streamlined scripts:

```bash
# Deploy to Hardhat's in-memory network
pnpm deploy:dev

# Deploy and mint tickets in one operation
pnpm mint:dev
```

### Production Deployment

For production deployments, follow these steps:

1. Configure `.env` with your production credentials
2. Run the deployment script targeting your production network:

```bash
pnpm deploy:mainnet
```

### Contract Verification

To verify your contract on Etherscan:

```bash
pnpm verify --network sepolia YOUR_DEPLOYED_CONTRACT_ADDRESS
```

### CI/CD Integration

TicketChain includes integrated CI/CD with GitHub Actions. The workflow includes:

- Setup stage
- Code quality checks
- Unit and integration tests
- Security scanning with Snyk

## Configuration Reference

| Parameter          | Default          | Description                                   | Where to Set                 |
| ------------------ | ---------------- | --------------------------------------------- | ---------------------------- |
| `MINTER_ROLE`      | Owner            | Controls who can create new tickets           | Contract, grantRole function |
| `PAUSER_ROLE`      | Owner            | Controls who can pause/unpause the contract   | Contract, grantRole function |
| `Gas Limit`        | 2,100,000        | Maximum computational effort for transactions | hardhat.config.ts            |
| `Gas Price`        | 8 gwei           | Price per unit of gas (network-specific)      | hardhat.config.ts            |
| `Optimizer Runs`   | 200              | Contract optimization level                   | hardhat.config.ts            |
| `Network Chain ID` | 1337 (localhost) | Blockchain network identifier                 | hardhat.config.ts            |

## Contributing Guide

We welcome contributions from the community! Follow these steps to contribute:

### Branching Model

- `main` - Production-ready code
- `develop` - Latest development changes
- `feature/*` - New features
- `bugfix/*` - Bug fixes

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test:all`)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### PR Checklist

- [ ] Tests added/updated for new functionality
- [ ] Integration tests added for complex features
- [ ] Documentation updated
- [ ] Code follows project style guide
- [ ] All tests passing

## Roadmap & Planned Features

- **Q2 2025**: Mobile app integration
- **Q3 2025**: Multi-chain support (Polygon, Optimism)
- **Q3 2025**: Advanced ticketing features (e.g., seat selection, tiered pricing)
- **Q4 2025**: Event organizer dashboard
- **Q1 2026**: Integration with point-of-sale systems
- **Future**: Layer 2 scaling solution integration

## Known Issues / Limitations

- **Gas Costs**: High gas prices on Ethereum mainnet can make individual ticket minting expensive
  - _Workaround_: Use batched minting or consider L2 solutions
- **Block Confirmation Times**: Event entry might require waiting for transaction confirmations
  - _Workaround_: Use state channels or implement a centralized verification layer
- **MetaMask Required**: Requires users to have MetaMask or similar wallet
  - _Workaround_: Implement custodial solution for mainstream adoption
- **Ethereum Node.js v23 Compatibility**: Some warnings appear with newer Node.js versions
  - _Workaround_: Use Node.js v18 for best compatibility (specified in .node-version file)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 TicketChain Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files...
```

## Acknowledgments & References

- OpenZeppelin for their secure contract implementations
- Ethereum Foundation documentation
- [ERC-721 Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721)
- [NFT Ticketing Research Paper](https://arxiv.org/abs/example)
- Inspired by [GET Protocol](https://get-protocol.io/) and other blockchain ticketing projects

## Contact & Community

- **GitHub Issues**: For bug reports and feature requests
- **Email**: team@ticketchain.example.com
- **Discord**: [Join our server](https://discord.gg/ticketchain)
- **Twitter**: [@TicketChainDev](https://twitter.com/ticketchaindev)
