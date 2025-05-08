import { HardhatUserConfig } from 'hardhat/config';

// Import plugins
require('@nomicfoundation/hardhat-toolbox');
require('@typechain/hardhat');
require('hardhat-gas-reporter');
require('hardhat-contract-sizer');
require('dotenv/config');
require('solidity-coverage');

// Special config for coverage testing with optimizations for stack depth
const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      // Enable IR-based code generation, which often helps with stack too deep errors
      viaIR: true,
      optimizer: {
        enabled: true,
        // Lower runs means more optimization for complex code
        runs: 1,
        // Detailed optimization settings
        details: {
          yul: true,
          yulDetails: {
            stackAllocation: true,
            optimizerSteps: 'dhfoDgvulfnTUtnIf',
          },
        },
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
  // Turn off gas reporter during coverage
  gasReporter: {
    enabled: false,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    // Don't run contract sizer during coverage
    runOnCompile: false,
    strict: false,
  },
  mocha: {
    timeout: 300000, // 5 minutes - coverage can be slow
  },
};

export default config;
