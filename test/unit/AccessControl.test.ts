import hardhat from 'hardhat';
import { expect } from 'chai';
import { TicketNFT } from '../../types/typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('TicketNFT Access Control', () => {
  let ticketNFT: TicketNFT;
  let owner: HardhatEthersSigner;
  let minter: HardhatEthersSigner;
  let nonMinter: HardhatEthersSigner;

  beforeEach(async () => {
    const [ownerSigner, minterSigner, nonMinterSigner] = await hardhat.ethers.getSigners();
    owner = ownerSigner;
    minter = minterSigner;
    nonMinter = nonMinterSigner;

    const TicketNFTFactory = await hardhat.ethers.getContractFactory('TicketNFT');
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
      price: hardhat.ethers.parseEther('0.1'),
      validFrom: BigInt(Math.floor(Date.now() / 1000) + 3600),
      validUntil: BigInt(Math.floor(Date.now() / 1000) + 7200),
      isTransferable: true,
    };

    await expect(
      ticketNFT.connect(nonMinter).mintTicket(nonMinter.address, 1, ticketMetadata)
    ).to.be.revertedWithCustomError(ticketNFT, 'MinterRoleRequired');
  });

  it('should allow minters to mint tickets', async () => {
    const ticketMetadata = {
      eventId: 1,
      price: hardhat.ethers.parseEther('0.1'),
      validFrom: BigInt(Math.floor(Date.now() / 1000) + 3600),
      validUntil: BigInt(Math.floor(Date.now() / 1000) + 7200),
      isTransferable: true,
    };

    await expect(ticketNFT.connect(minter).mintTicket(minter.address, 1, ticketMetadata)).to.not.be
      .reverted;
  });

  it('should prevent revoking admin role for owner', async () => {
    const DEFAULT_ADMIN_ROLE = await ticketNFT.DEFAULT_ADMIN_ROLE();

    await expect(
      ticketNFT.renounceRole(DEFAULT_ADMIN_ROLE, owner.address)
    ).to.be.revertedWithCustomError(ticketNFT, 'CannotRenounceAdminRole');
  });
});
