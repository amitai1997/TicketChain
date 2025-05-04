// Utility functions for deployment and interaction scripts

const fs = require('fs');
const path = require('path');

/**
 * Save deployment information to a JSON file
 * @param {string} networkName - Name of the network deployed to
 * @param {object} deploymentInfo - Deployment information object
 */
function saveDeploymentInfo(networkName, deploymentInfo) {
  const deploymentDir = path.join(__dirname, '../../deployments');
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  
  // Save deployment info
  const filePath = path.join(deploymentDir, `${networkName}-deployment.json`);
  fs.writeFileSync(
    filePath,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`Deployment info saved to ${filePath}`);
}

/**
 * Load deployment information from a JSON file
 * @param {string} networkName - Name of the network to load from
 * @returns {object|null} - Deployment information object or null if not found
 */
function loadDeploymentInfo(networkName) {
  const filePath = path.join(__dirname, '../../deployments', `${networkName}-deployment.json`);
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.warn(`No deployment info found for network: ${networkName}`);
    return null;
  }
}

/**
 * Format and log gas usage for a transaction
 * @param {object} tx - Transaction object
 * @param {string} label - Description for this transaction
 */
async function logGasUsage(tx, label) {
  const receipt = await tx.wait();
  const gasUsed = receipt.gasUsed.toString();
  const txHash = receipt.hash;
  
  console.log(`Gas used for ${label}: ${gasUsed} units`);
  console.log(`Transaction hash: ${txHash}`);
  
  return receipt;
}

/**
 * Generate a current timestamp in seconds
 * @param {number} offsetSeconds - Optional offset in seconds
 * @returns {number} - Current timestamp in seconds
 */
function getCurrentTimestamp(offsetSeconds = 0) {
  return Math.floor(Date.now() / 1000) + offsetSeconds;
}

module.exports = {
  saveDeploymentInfo,
  loadDeploymentInfo,
  logGasUsage,
  getCurrentTimestamp
};
