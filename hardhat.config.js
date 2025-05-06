require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-ethers');
require('dotenv').config(); // For loading environment variables

// Default to development values if environment variables are not set
const INFURA_API_KEY = process.env.INFURA_API_KEY || 'your-infura-key';
const PRIVATE_KEY =
  process.env.PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000';

module.exports = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  networks: {
    // Local development
    hardhat: {
      chainId: 1337,
    },
    // Local node
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 1337,
    },
    // Sepolia testnet
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      gas: 2100000,
      gasPrice: 8000000000, // 8 gwei
    },
    // Goerli testnet (alternative)
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 5,
    },
    // Mainnet configuration (be careful with this!)
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 1,
      gasPrice: 20000000000, // 20 gwei
    },
  },
  mocha: {
    timeout: 100000,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  typechain: {
    outDir: 'types/typechain-types',
    target: 'ethers-v6',
  },
};
