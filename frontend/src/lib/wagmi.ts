// File: src/lib/wagmi.ts
import { configureChains, createConfig } from 'wagmi'
import { mainnet, sepolia, hardhat, polygonMumbai } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import { 
  injectedWallet, 
  metaMaskWallet, 
  coinbaseWallet, 
} from '@rainbow-me/rainbowkit/wallets'

// Get RPC URL from environment variables
const rpcUrl = 'http://localhost:8545'

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    // Add networks based on environment
    hardhat, 
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

// Add wallet connectors without WalletConnect to avoid dependency issues
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
