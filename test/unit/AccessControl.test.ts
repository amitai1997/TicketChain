import hre from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

// Import custom matchers
import "@nomicfoundation/hardhat-chai-matchers";

describe('TicketNFT Access Control', () => {
  let ticketNFT: any; // Use any to avoid TypeScript errors
  let owner: SignerWithAddress;
  let minter: SignerWithAddress;
  let nonMinter: SignerWithAddress;

  beforeEach(async () => {
    const [ownerSigner, minterSigner, nonMinterSigner] = await hre.ethers.getSigners();
    owner = ownerSigner;
    minter = minterSigner;
    nonMinter = nonMinterSigner;

    const TicketNFTFactory = await hre.ethers.getContractFactory('TicketNFT');
    ticketNFT = await TicketNFTFactory.deploy();

    const MINTER_ROLE = await ticketNFT.MINTER_ROLE();
    await ticketNFT.grantRole(MINTER_ROLE, minter.address);
  });

  it('should have correct initial roles', async () => {
    const DEFAULT_ADMIN_ROLE = await ticketNFT.DEFAULT_ADMIN_ROLE();
    const MINTER_ROLE = await ticketNFT.MINTER_ROLE();

    expect(await ticketNFT.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    expect(await ticketNFT.hasRole(MINTER_ROLE, owner.address)).to.be.true;
    expect(await ticketNFT.hasRole(MINTER_ROLE, minter.address)).to.be.true;
  });

  it('should allow admin to grant minter role', async () => {
    const MINTER_ROLE = await ticketNFT.MINTER_ROLE();
    await ticketNFT.grantRole(MINTER_ROLE, nonMinter.address);

    expect(await ticketNFT.hasRole(MINTER_ROLE, nonMinter.address)).to.be.true;
  });

  it('should prevent non-minters from minting tickets', async () => {
    const ticketMetadata = {
      eventId: 1,
      price: hre.ethers.parseEther('0.1'),
      validFrom: Math.floor(Date.now() / 1000) + 3600,
      validUntil: Math.floor(Date.now() / 1000) + 7200,
      isTransferable: true,
    };

    await expect(
      ticketNFT.connect(nonMinter).mintTicket(
        nonMinter.address, 
        1, 
        ticketMetadata.eventId, 
        ticketMetadata.price, 
        ticketMetadata.validFrom, 
        ticketMetadata.validUntil, 
        ticketMetadata.isTransferable
      )
    ).to.be.reverted;
  });

  it('should allow minters to mint tickets', async () => {
    const ticketMetadata = {
      eventId: 1,
      price: hre.ethers.parseEther('0.1'),
      validFrom: Math.floor(Date.now() / 1000) + 3600,
      validUntil: Math.floor(Date.now() / 1000) + 7200,
      isTransferable: true,
    };

    await expect(
      ticketNFT.connect(minter).mintTicket(
        minter.address, 
        1, 
        ticketMetadata.eventId, 
        ticketMetadata.price, 
        ticketMetadata.validFrom, 
        ticketMetadata.validUntil, 
        ticketMetadata.isTransferable
      )
    ).not.to.be.reverted;
  });

  it('should prevent revoking admin role for owner', async () => {
    const DEFAULT_ADMIN_ROLE = await ticketNFT.DEFAULT_ADMIN_ROLE();

    await expect(
      ticketNFT.renounceRole(DEFAULT_ADMIN_ROLE, owner.address)
    ).to.be.reverted;
  });
});
