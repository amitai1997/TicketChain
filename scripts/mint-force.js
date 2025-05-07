#!/usr/bin/env node
// Simple script that forces a new deployment and minting of tickets
// Run this script with: npx hardhat run scripts/mint-force.js

const { execSync } = require('child_process');
const path = require('path');

// This script is a wrapper that just calls the deploy-and-mint.js script
// It's a simple solution to ensure that the mint command always works
try {
  console.log('Starting deployment and minting process...');

  // We'll just execute the deploy-and-mint.js script via the hardhat command
  const deployAndMintPath = path.resolve(__dirname, 'deploy-and-mint.js');

  // Using execSync to run the command and capture/display output in real-time
  execSync(`npx hardhat run ${deployAndMintPath}`, {
    stdio: 'inherit', // This passes through all stdio from the child process
  });

  console.log('Process completed successfully!');
} catch (error) {
  console.error('Error executing the deployment and minting process:', error.message);
  process.exit(1);
}
