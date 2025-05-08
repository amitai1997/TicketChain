import hre from 'hardhat';
import { TicketNFT } from '../../typechain-types/contracts/TicketNFT';

export async function setupMinterRole(contractAddress: string): Promise<void> {
  const [deployer] = await hre.ethers.getSigners();

  // Use getContractAt to get the contract instance
  const ticketNFT = await hre.ethers.getContractAt(
    'TicketNFT', 
    contractAddress
  ) as any;

  // Get the MINTER_ROLE by calling the public constant
  try {
    // Calculate it in JS to avoid contract calls
    const MINTER_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("MINTER_ROLE"));
    console.log(`MINTER_ROLE hash: ${MINTER_ROLE}`);

    // Check if deployer already has the minter role
    const hasMinterRole = await ticketNFT.hasRole(MINTER_ROLE, deployer.address);

    if (!hasMinterRole) {
      console.log(`Granting MINTER_ROLE to ${deployer.address}`);
      const tx = await ticketNFT.grantRole(MINTER_ROLE, deployer.address);
      await tx.wait();
      console.log('MINTER_ROLE granted successfully.');
    } else {
      console.log(`${deployer.address} already has MINTER_ROLE`);
    }
  } catch (error) {
    console.error("Error accessing or granting MINTER_ROLE:", error);
    throw error;
  }
}
