# TicketChain

TicketChain is a blockchain-based event ticketing system built on Ethereum. It allows event organizers to create events and mint NFT tickets, while providing control over the secondary market through minimum and maximum resale prices and royalty payments.

## Features

- Event Creation: Organizers can create events with customizable parameters
- NFT Tickets: Tickets are minted as ERC-721 NFTs with metadata
- Secondary Market: Built-in marketplace for ticket resale
- Royalty System: Organizers receive a percentage of resale transactions
- Price Controls: Set minimum and maximum resale prices
- Ticket Validation: Simple system to validate tickets at the event

## Getting Started

### Prerequisites

- Node.js (LTS version recommended - v18.x or v20.x)
- npm
- MetaMask or another Ethereum wallet
- Test ETH on Sepolia testnet (for testnet deployment)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/TicketChain.git
   cd TicketChain
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file with your configuration:
   ```
   PRIVATE_KEY=your_private_key
   SEPOLIA_URL=your_sepolia_node_url
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

### Compile Contracts

Compile the smart contracts:
```
npx hardhat compile
```

### Deployment Options

#### Option 1: Deploy to Local Development Network (Recommended for development)

For a persistent local development environment:

1. Start a local Hardhat node in one terminal:
   ```
   npx hardhat node
   ```

2. In a second terminal, deploy your contracts with the setup script:
   ```
   npx hardhat run scripts/deploy-and-setup.js --network localhost
   ```

The local node will maintain its state until you stop it, allowing for testing over time. The setup script automatically:
- Deploys the contract
- Creates sample events
- Mints test tickets
- Sets up everything for immediate testing

#### Option 2: Deploy to Sepolia Testnet

Before deploying to Sepolia, make sure you have:
- Set up your `.env` file with `PRIVATE_KEY` and `SEPOLIA_URL`
- Obtained test ETH from a Sepolia faucet (see below)

Deploy to Sepolia:
```
npx hardhat run scripts/deploy.js --network sepolia
```

### Getting Test ETH on Sepolia

To get test ETH on Sepolia, you can use any of these faucets:

- [Chainlink Faucet](https://faucets.chain.link/sepolia)
- [QuickNode Faucet](https://faucet.quicknode.com/ethereum/sepolia)
- [LearnWeb3 Faucet](https://learnweb3.io/faucets/sepolia/)

## Frontend Setup

The TicketChain frontend is a simple web interface that connects to the Ethereum blockchain through MetaMask.

### Running the Frontend

1. Start a simple HTTP server in the frontend directory:
   ```
   cd frontend
   python3 -m http.server 8000
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

### Configuring MetaMask for Local Development

To connect MetaMask to your local Hardhat node:

1. Open MetaMask and click on the network dropdown
2. Select "Add Network" > "Add a network manually"
3. Fill in the following details:
   - Network Name: `Hardhat Local`
   - New RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
4. Click "Save"

### Importing a Test Account

To use the test accounts that Hardhat generates:

1. In MetaMask, click on your account icon
2. Select "Import Account"
3. Paste one of the private keys from the Hardhat console output
   (e.g., `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` for the first account)
4. Click "Import"

You should now have 10,000 test ETH to use in your local development environment.

## Important Notes for Frontend Development

### Contract Address

The default contract address in the frontend code is set to the address that Hardhat generally uses for the first deployed contract:

```
0x5FbDB2315678afecb367f032d93F642f64180aa3
```

If your contract is deployed to a different address, update this value in `frontend/app.js`.

### Debugging Tips

If you encounter issues with the frontend:

1. **Console errors related to events**: The frontend uses a simplified approach to display tickets by checking the user's balance rather than filtering events. This is more robust as filtering by non-indexed parameters can cause errors.

2. **MetaMask connection issues**: Ensure you're connected to the Hardhat Local network and have imported an account with sufficient test ETH.

3. **Transaction failures**: Check the Hardhat node console for detailed error messages that can help debug contract interaction issues.

4. **Restart Hardhat node if needed**: If you encounter strange behavior, try restarting your Hardhat node and redeploying:
   ```
   # Kill existing node
   pkill -f "hardhat node"
   
   # Start fresh node
   npx hardhat node
   
   # In a new terminal, redeploy contracts
   npx hardhat run scripts/deploy-and-setup.js --network localhost
   ```

5. **Frontend reloads**: After purchasing tickets, the frontend will automatically check your balance. If tickets don't appear immediately, use the refresh button to check again, as there can be slight delays in transaction indexing.

## Smart Contract Interface

### Event Creation
```solidity
function createEvent(
    string memory name,
    string memory description,
    uint256 ticketPrice,
    uint256 maxTickets,
    uint256 eventDate,
    uint256 minResalePrice,
    uint256 maxResalePrice,
    uint256 royaltyPercentage
) public returns (uint256)
```

### Ticket Minting
```solidity
function mintTicket(uint256 eventId, string memory metadataURI) public payable returns (uint256)
```

### Secondary Market
```solidity
function listTicketForResale(uint256 tokenId, uint256 price) public
function buyResaleTicket(uint256 tokenId) public payable
function cancelResaleListing(uint256 tokenId) public
```

### Event Management
```solidity
function cancelEvent(uint256 eventId) public
function isTicketValid(uint256 tokenId) public view returns (bool)
function getEvent(uint256 eventId) public view returns (Event memory)
function getEventCount() public view returns (uint256)
```

## Advanced Development

### Modifying the Contract

If you need to modify the contract, especially if you need to add indexed parameters to events for better filtering, make these changes in the solidity files and then:

1. Recompile the contracts:
   ```
   npx hardhat compile
   ```

2. Update the ABI in `frontend/app.js` with the new ABI from `artifacts/contracts/TicketNFT.sol/TicketNFT.json`

3. Redeploy the contract:
   ```
   npx hardhat run scripts/deploy-and-setup.js --network localhost
   ```

### Creating a Production Build

For production deployment:

1. Use a proper web server instead of the Python development server
2. Minify and bundle your frontend JavaScript files
3. Deploy to a production blockchain network
4. Update the contract address and network settings accordingly

## License

This project is licensed under the MIT License.
