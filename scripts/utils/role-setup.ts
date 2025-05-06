import { ethers } from 'hardhat';

export async function setupMinterRole(contractAddress: string): Promise<void> {
  const [deployer] = await ethers.getSigners();

  const TicketNFT = await ethers.getContractFactory('TicketNFT');
  const ticketNFT = TicketNFT.attach(contractAddress);

  // Typescript requires explicit conversion for keccak256
  const MINTER_ROLE = await ticketNFT.MINTER_ROLE();

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
}
