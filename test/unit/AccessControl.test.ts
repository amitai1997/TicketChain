import { expect } from 'chai';
import { TicketNFT } from '../../typechain-types/contracts';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { ethers } from 'ethers';

describe('TicketNFT Access Control', () => {
  let ticketNFT: TicketNFT;
  let owner: HardhatEthersSigner;
  let minter: HardhatEthersSigner;
  let nonMinter: HardhatEthersSigner;

  beforeEach(async () => {
    const [ownerSigner, minterSigner, nonMinterSigner] =
      await require('hardhat').ethers.getSigners();
    owner = ownerSigner;
    minter = minterSigner;
    nonMinter = nonMinterSigner;

    const TicketNFTFactory = await require('hardhat').ethers.getContractFactory('TicketNFT');
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
      price: ethers.parseEther('0.1'),
      validFrom: BigInt(Math.floor(Date.now() / 1000) + 3600),
      validUntil: BigInt(Math.floor(Date.now() / 1000) + 7200),
      isTransferable: true,
    };

    // @ts-ignore: Hardhat Chai matcher
    await expect(
      ticketNFT
        .connect(nonMinter)
        .mintTicket(
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
      price: ethers.parseEther('0.1'),
      validFrom: BigInt(Math.floor(Date.now() / 1000) + 3600),
      validUntil: BigInt(Math.floor(Date.now() / 1000) + 7200),
      isTransferable: true,
    };

    // @ts-ignore: Hardhat Chai matcher
    await expect(
      ticketNFT
        .connect(minter)
        .mintTicket(
          minter.address,
          1,
          ticketMetadata.eventId,
          ticketMetadata.price,
          ticketMetadata.validFrom,
          ticketMetadata.validUntil,
          ticketMetadata.isTransferable
        )
    ).to.not.be.reverted;
  });

  it('should prevent revoking admin role for owner', async () => {
    const DEFAULT_ADMIN_ROLE = await ticketNFT.DEFAULT_ADMIN_ROLE();

    // @ts-ignore: Hardhat Chai matcher
    await expect(ticketNFT.renounceRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.reverted;
  });
});
