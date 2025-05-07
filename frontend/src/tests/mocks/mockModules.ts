// Mock module for TicketNFT.json
import TicketNFTMock from './TicketNFT.json';

// Vi module mocking for tests
import { vi } from 'vitest';

// Create mock for ethers.js
vi.mock('ethers', () => {
  return {
    ethers: {
      providers: {
        Web3Provider: vi.fn().mockImplementation(() => ({
          getSigner: vi.fn().mockReturnValue({
            getAddress: vi.fn().mockResolvedValue('0x123456789'),
          }),
        })),
      },
      Contract: vi.fn(),
      utils: {
        parseEther: vi.fn((value) => value),
        formatEther: vi.fn((value) => value),
        hexlify: vi.fn((value) => value),
      },
    },
  };
});

// Mock the wagmi hooks
vi.mock('wagmi', () => ({
  useContractRead: vi.fn().mockReturnValue({ data: null }),
  useAccount: vi.fn().mockReturnValue({ address: null, isConnected: false }),
}));

// Mock the artifacts
vi.mock('../artifacts/contracts/TicketNFT.sol/TicketNFT.json', () => {
  return {
    default: TicketNFTMock,
  };
}, { virtual: true });
