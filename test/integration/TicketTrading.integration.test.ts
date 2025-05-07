import hardhat from 'hardhat';
import { expect } from 'chai';
import { TicketNFT } from '../../types/typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('TicketNFT Trading Integration', () => {
  let ticketNFT: TicketNFT;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let owner: HardhatEthersSigner;
  let minter: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;
  let secondBuyer: HardhatEthersSigner;

  beforeEach(async () => {
    const [ownerSigner, minterSigner, buyerSigner, secondBuyerSigner] =
      await hardhat.ethers.getSigners();
    owner = ownerSigner;
    minter = minterSigner;
    buyer = buyerSigner;
    secondBuyer = secondBuyerSigner;

    // Deploy the contract
    const TicketNFTFactory = await hardhat.ethers.getContractFactory('TicketNFT');
    ticketNFT = await TicketNFTFactory.deploy();

    // Grant minter role
    const MINTER_ROLE = await ticketNFT.MINTER_ROLE();
    await ticketNFT.grantRole(MINTER_ROLE, minter.address);
  });

  it('should complete a full ticket lifecycle - mint, transfer, and validate', async () => {
    // 1. Create a ticket
    const currentTime = Math.floor(Date.now() / 1000);
    const ticketMetadata = {
      eventId: 1,
      price: hardhat.ethers.parseEther('0.5'),
      validFrom: BigInt(currentTime + 3600), // 1 hour from now
      validUntil: BigInt(currentTime + 7200), // 2 hours from now
      isTransferable: true,
    };

    // Mint the ticket to the buyer
    await ticketNFT.connect(minter).mintTicket(buyer.address, 1, ticketMetadata);

    // Verify ownership
    expect(await ticketNFT.ownerOf(1)).to.equal(buyer.address);

    // 2. Transfer the ticket to a second buyer
    await ticketNFT.connect(buyer)['safeTransferFrom(address,address,uint256)'](
      buyer.address, 
      secondBuyer.address, 
      1
    );

    // Verify the new ownership
    expect(await ticketNFT.ownerOf(1)).to.equal(secondBuyer.address);

    // 3. Advance time to make the ticket valid
    await hardhat.ethers.provider.send('evm_setNextBlockTimestamp', [currentTime + 5000]);
    await hardhat.ethers.provider.send('evm_mine');

    // 4. Verify ticket validity
    const isValid = await ticketNFT.isTicketValid(1);
    expect(isValid).to.be.true;

    // 5. Advance time to make the ticket expired
    await hardhat.ethers.provider.send('evm_setNextBlockTimestamp', [currentTime + 8000]);
    await hardhat.ethers.provider.send('evm_mine');

    // 6. Verify ticket is no longer valid
    const isExpired = await ticketNFT.isTicketValid(1);
    expect(isExpired).to.be.false;
  });

  it('should handle minting and managing multiple tickets for an event', async () => {
    const currentTime = Math.floor(Date.now() / 1000);
    const eventId = 2;

    // Create 3 tickets for the same event
    for (let i = 1; i <= 3; i++) {
      const ticketMetadata = {
        eventId: eventId,
        price: hardhat.ethers.parseEther(String(0.5 * i)), // Different prices
        validFrom: BigInt(currentTime + 3600),
        validUntil: BigInt(currentTime + 7200),
        isTransferable: i % 2 === 0, // Alternating transferability
      };

      await ticketNFT.connect(minter).mintTicket(buyer.address, i, ticketMetadata);
    }

    // Verify each ticket has the correct metadata
    for (let i = 1; i <= 3; i++) {
      const ticket = await ticketNFT.getTicketMetadata(i);
      expect(ticket.eventId).to.equal(eventId);
      expect(ticket.price).to.equal(hardhat.ethers.parseEther(String(0.5 * i)));
      expect(ticket.isTransferable).to.equal(i % 2 === 0);
    }

    // Try to transfer a non-transferable ticket (should fail)
    const nonTransferableTicketId = 1; // First ticket is non-transferable
    await expect(
      ticketNFT.connect(buyer)['safeTransferFrom(address,address,uint256)'](
        buyer.address, 
        secondBuyer.address, 
        nonTransferableTicketId
      )
    ).to.be.revertedWithCustomError(ticketNFT, 'TicketNotTransferable');

    // Transfer a transferable ticket (should succeed)
    const transferableTicketId = 2; // Second ticket is transferable
    await ticketNFT.connect(buyer)['safeTransferFrom(address,address,uint256)'](
      buyer.address, 
      secondBuyer.address, 
      transferableTicketId
    );

    // Verify the ownership changed
    expect(await ticketNFT.ownerOf(transferableTicketId)).to.equal(secondBuyer.address);
  });
});
