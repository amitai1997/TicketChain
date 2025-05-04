# Contributing to TicketChain

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please report unacceptable behavior to project maintainers.

## Development Process

### Prerequisites

- Node.js (v16+)
- Yarn or npm
- Hardhat
- MetaMask or Web3 Wallet
- Polygon Mumbai Testnet access

### Setup

1. Fork the repository
2. Clone your fork
   ```bash
   git clone https://github.com/[YOUR_USERNAME]/TicketChain.git
   cd TicketChain
   ```

3. Install dependencies
   ```bash
   yarn install
   ```

4. Set up environment variables
   Create a `.env` file in the project root with:
   ```
   POLYGON_MUMBAI_RPC_URL=your_rpc_url
   PRIVATE_KEY=your_wallet_private_key
   ```

### Development Workflow

1. Create a new branch for your feature
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes
   - Follow TypeScript and Solidity best practices
   - Write unit tests for new functionality
   - Ensure all tests pass before submitting a PR

3. Run tests
   ```bash
   # Run Smart Contract tests
   yarn test:contracts

   # Run Frontend tests
   yarn test:frontend

   # Run full test suite
   yarn test
   ```

4. Lint your code
   ```bash
   yarn lint
   yarn format
   ```

### Smart Contract Development

- All smart contracts must be thoroughly tested
- Use OpenZeppelin libraries for security
- Include comprehensive NatSpec comments
- Implement proper access controls
- Optimize for gas efficiency

### Code Review Process

1. Open a pull request with a clear title and description
2. Ensure all CI checks pass
3. Await review from maintainers
4. Address any feedback promptly

### Reporting Bugs

- Use GitHub Issues
- Provide a clear, detailed description
- Include steps to reproduce
- Attach relevant logs or screenshots

### Feature Requests

- Open a GitHub Issue
- Describe the proposed feature
- Explain the use case and potential implementation

## Security

### Reporting Security Issues

- Do NOT open public issues for security vulnerabilities
- Email security@ticketchain.org with details
- Include steps to reproduce and potential impact
- Expect a response within 48 hours

## Additional Resources

- [Hardhat Documentation](https://hardhat.org/getting-started/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Polygon Documentation](https://docs.polygon.technology/)

## Code of Conduct

### Our Pledge

In the interest of fostering an open and welcoming environment, we as contributors and maintainers pledge to making participation in our project and our community a harassment-free experience for everyone.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior include:

- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate in a professional setting

## Enforcement

Project maintainers who do not follow or enforce the Code of Conduct in good faith may face temporary or permanent repercussions as determined by other members of the project's leadership.

## Attribution

This Contributing Guidelines are adapted from the [Contributor Covenant][homepage], version 1.4, available at [http://contributor-covenant.org/version/1/4/][version]

[homepage]: http://contributor-covenant.org
[version]: http://contributor-covenant.org/version/1/4/
