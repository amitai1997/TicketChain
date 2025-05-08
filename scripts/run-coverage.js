#!/usr/bin/env node

// Script to run coverage with the right compiler settings

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Backup the original hardhat.config.ts
const hardhatConfigPath = path.join(__dirname, '..', 'hardhat.config.ts');
const hardhatConfigBackupPath = path.join(__dirname, '..', 'hardhat.config.ts.bak');

try {
  // Create backup
  fs.copyFileSync(hardhatConfigPath, hardhatConfigBackupPath);
  console.log('Backed up original hardhat.config.ts');

  // Create a modified config to ensure viaIR is enabled
  const configContent = `
import { HardhatUserConfig } from 'hardhat/config';

// Import plugins
require('@nomicfoundation/hardhat-toolbox');
require('@typechain/hardhat');
require('hardhat-gas-reporter');
require('hardhat-contract-sizer');
require('dotenv/config');

// Always enable viaIR to handle stack too deep errors
const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      viaIR: true,
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

export default config;`;

  // Write modified config
  fs.writeFileSync(hardhatConfigPath, configContent);
  console.log('Created enhanced config with viaIR enabled');

  // Run coverage
  console.log('Running coverage...');
  execSync('SOLIDITY_COVERAGE=true npx hardhat coverage --testfiles "test/unit/*.test.ts"', {
    stdio: 'inherit',
  });

  console.log('Coverage completed successfully!');
} catch (error) {
  console.error('Error during coverage:', error);
  process.exit(1);
} finally {
  // Restore original config
  if (fs.existsSync(hardhatConfigBackupPath)) {
    fs.copyFileSync(hardhatConfigBackupPath, hardhatConfigPath);
    fs.unlinkSync(hardhatConfigBackupPath);
    console.log('Restored original hardhat.config.ts');
  }
}
