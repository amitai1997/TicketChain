// File: src/setupTests.ts
import '@testing-library/jest-dom'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock,
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock ethereum provider
Object.defineProperty(window, 'ethereum', {
  value: {
    isMetaMask: true,
    request: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
  },
})

// Mock for wagmi connections
jest.mock('wagmi', () => ({
  ...jest.requireActual('wagmi'),
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnecting: false,
    isDisconnected: false,
    isConnected: true,
  }),
  useContractRead: () => ({
    data: BigInt('0'),
    isError: false,
    isLoading: false,
  }),
  useContractWrite: () => ({
    writeAsync: jest.fn().mockResolvedValue({ hash: '0x123' }),
    isLoading: false,
    isError: false,
  }),
  useContractEvent: jest.fn(),
}))

// Mock for RainbowKit
jest.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({ children }: { children: any }) =>
      children({
        account: { address: '0x1234567890123456789012345678901234567890', displayName: '0x1234...7890' },
        chain: { unsupported: false },
        openConnectModal: jest.fn(),
        openAccountModal: jest.fn(),
        openChainModal: jest.fn(),
        mounted: true,
      }),
  },
}))

// Silence console errors during tests
const originalConsoleError = console.error
console.error = (...args) => {
  if (
    /Warning: ReactDOM.render is no longer supported in React 18/.test(args[0])
  ) {
    return
  }
  originalConsoleError(...args)
}
