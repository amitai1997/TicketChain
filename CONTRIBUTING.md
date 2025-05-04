# Contributing to TicketChain

Thank you for considering contributing to TicketChain! This document explains the project structure, development workflow, and contribution guidelines.

## Project Structure

```
ticketchain/
├── .github/                  # GitHub workflows and configuration
├── contracts/                # Smart contracts
│   ├── interfaces/           # Contract interfaces
│   ├── libraries/            # Reusable contract libraries
│   ├── mocks/                # Mock contracts for testing
│   └── TicketNFT.sol         # Main contract implementation
├── scripts/                  # Deployment and interaction scripts
│   ├── utils/                # Helper utilities for scripts
│   ├── deploy.js             # Main deployment script
│   └── mint-tickets.js       # Script for minting tickets
├── test/                     # Test suite
│   ├── fixtures/             # Test fixtures and shared setup
│   ├── unit/                 # Unit tests for individual contracts
│   ├── integration/          # Integration tests across contracts
│   └── utils/                # Test utilities and helpers
├── types/                    # TypeScript type definitions
│   └── typechain-types/      # Generated TypeScript interfaces
├── deployments/              # Deployment artifacts by network
└── ...                       # Other project files
```

## Development Workflow

### Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/ticketchain.git`
3. Install dependencies: `npm install`
4. Create a `.env` file based on `.env.example`

### Branching Model

- `main` - Production-ready code
- `develop` - Latest development changes
- `feature/*` - New features
- `bugfix/*` - Bug fixes

### Development Process

1. Create a feature branch from `develop`: `git checkout -b feature/your-feature`
2. Make your changes
3. Run tests: `npm test`
4. Make sure linting passes: `npm run lint`
5. Commit your changes following conventional commits format
6. Push your branch: `git push origin feature/your-feature`
7. Create a Pull Request to the `develop` branch

## Pull Request Guidelines

- Target the `develop` branch for most changes
- Fill out the PR template completely
- Ensure all tests pass
- Update documentation as needed
- Add tests for new features
- Follow the code style of the project
- Keep PRs focused on a single change

### Before Submitting a PR

- [ ] Run the test suite with `npm test`
- [ ] Run linting with `npm run lint`
- [ ] Update documentation if necessary
- [ ] Make sure your commits follow conventional commit format

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for our commit messages:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Example: `feat(contracts): implement ticket transferability toggle`

## Testing

- Unit tests: `npm test`
- Integration tests: `npm run test:integration`
- Test coverage: `npm run test:coverage`

## Code Style

We use:
- Solhint for Solidity linting
- ESLint for JavaScript/TypeScript linting
- Prettier for code formatting

Run `npm run lint` to check code style.

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
