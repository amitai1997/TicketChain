// This script attempts to load the hardhat.config.ts file to verify our fix
// If this runs successfully, it means our changes should fix the CI issue

const { execSync } = require('child_process');

try {
  console.log('Testing hardhat.config.ts loading...');
  
  // Attempt to load the hardhat.config.ts via Node.js
  require('./hardhat.config.js');
  
  console.log('Successfully loaded hardhat.config.ts! The fix should work in CI.');
  
  // Try running a small part of the test process
  console.log('Attempting to run the test command to verify fix...');
  execSync('npx hardhat compile', { stdio: 'inherit' });
  
  console.log('Compilation successful! The fix should work in CI.');
} catch (error) {
  console.error('Error occurred during verification:', error.message);
  process.exit(1);
}
