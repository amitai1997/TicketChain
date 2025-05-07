import { HardhatUserConfig } from 'hardhat/config';

// Import plugins
require('@nomicfoundation/hardhat-toolbox');
require('@typechain/hardhat');
require('hardhat-gas-reporter');
require('hardhat-contract-sizer');
require('dotenv/config');

// Determine if we're running in coverage mode
const isCoverage = process.env.SOLIDITY_COVERAGE === 'true';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      // Disable IR when in coverage mode
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
    hardhat: {
      chainId: 1337,
      allowUnlimitedContractSize: true,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: [':TicketNFT$'],
  },
  mocha: {
    timeout: 100000, // 100 seconds
  },
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v6',
  },
};

export default config;
