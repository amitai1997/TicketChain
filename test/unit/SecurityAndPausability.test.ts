import hardhat from 'hardhat';
import { expect } from 'chai';
import { TicketNFT } from '../../types/typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('TicketNFT Security and Pausability', () => {
  let ticketNFT: TicketNFT;
  let owner: HardhatEthersSigner;
  let minter: HardhatEthersSigner;
  let attacker: HardhatEthersSigner;

  beforeEach(async () => {
    const [ownerSigner, minterSigner, attackerSigner] = await hardhat.ethers.getSigners();
    owner = ownerSigner;
    minter = minterSigner;
    attacker = attackerSigner;

    const TicketNFTFactory = await hardhat.ethers.getContractFactory('TicketNFT');
    ticketNFT = await TicketNFTFactory.deploy();

    const MINTER_ROLE = await ticketNFT.MINTER_ROLE();
    const PAUSER_ROLE = await ticketNFT.PAUSER_ROLE();
    await ticketNFT.grantRole(MINTER_ROLE, minter.address);
    await ticketNFT.grantRole(PAUSER_ROLE, minter.address);
  });

  it('should pause contract and prevent minting', async () => {
    await ticketNFT.pause();

    const ticketMetadata = {
      eventId: 1,
      price: hardhat.ethers.parseEther('0.1'),
      validFrom: BigInt(Math.floor(Date.now() / 1000) + 3600),
      validUntil: BigInt(Math.floor(Date.now() / 1000) + 7200),
      isTransferable: true,
    };

    await expect(
      ticketNFT.connect(minter).mintTicket(minter.address, 1, ticketMetadata)
    ).to.be.revertedWithCustomError(ticketNFT, 'ContractPaused');
  });

  it('should unpause contract and allow minting', async () => {
    await ticketNFT.pause();
    await ticketNFT.unpause();

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

  it('should prevent non-pauser from pausing', async () => {
    await expect(ticketNFT.connect(attacker).pause()).to.be.revertedWithCustomError(
      ticketNFT,
      'AccessControlUnauthorizedAccount'
    );
  });

  it('should prevent non-pauser from unpausing', async () => {
    await ticketNFT.pause();
    await expect(ticketNFT.connect(attacker).unpause()).to.be.revertedWithCustomError(
      ticketNFT,
      'AccessControlUnauthorizedAccount'
    );
  });

  it('should prevent token transfer when paused', async () => {
    const ticketMetadata = {
      eventId: 1,
      price: hardhat.ethers.parseEther('0.1'),
      validFrom: BigInt(Math.floor(Date.now() / 1000) + 3600),
      validUntil: BigInt(Math.floor(Date.now() / 1000) + 7200),
      isTransferable: true,
    };

    await ticketNFT.connect(minter).mintTicket(minter.address, 1, ticketMetadata);
    await ticketNFT.pause();

    const newOwner = (await hardhat.ethers.getSigners())[3];
    await expect(
      ticketNFT
        .connect(minter)
        ['safeTransferFrom(address,address,uint256)'](minter.address, newOwner.address, 1)
    ).to.be.revertedWithCustomError(ticketNFT, 'ContractPaused');
  });
});
