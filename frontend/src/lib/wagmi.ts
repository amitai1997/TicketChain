// File: src/lib/wagmi.ts
import { configureChains, createConfig } from 'wagmi'
import { mainnet, sepolia, polygonMumbai } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import { 
  injectedWallet, 
  metaMaskWallet, 
  coinbaseWallet, 
} from '@rainbow-me/rainbowkit/wallets'

// Custom Hardhat chain with ID 1337 (0x539) to match MetaMask's expected value
const hardhatChain = {
  id: 1337,
  name: 'Hardhat Local',
  network: 'hardhat',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  testnet: true,
}

// Get RPC URL from environment variables
const rpcUrl = 'http://127.0.0.1:8545'

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    // Add networks based on environment
    hardhatChain, 
    sepolia, 
    polygonMumbai,
    mainnet
  ],
  [
    // JSON RPC provider from env
    jsonRpcProvider({
      rpc: () => ({
        http: rpcUrl,
      }),
    }),
    // Fallback to public provider
    publicProvider(),
  ]
)

// Configure wallets for RainbowKit
const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      injectedWallet({ chains }),
      metaMaskWallet({ projectId: 'ticketchain', chains }),
      coinbaseWallet({ appName: 'TicketChain', chains }),
    ],
  },
])

// Create the Wagmi client
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})

export { chains }
