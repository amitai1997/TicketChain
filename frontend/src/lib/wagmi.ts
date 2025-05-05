// File: src/lib/wagmi.ts
import { configureChains, createClient } from 'wagmi'
import { mainnet, sepolia, hardhat, polygonMumbai } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { connectorsForWallets, getDefaultWallets } from '@rainbow-me/rainbowkit'
import { 
  injectedWallet, 
  metaMaskWallet, 
  coinbaseWallet, 
  walletConnectWallet 
} from '@rainbow-me/rainbowkit/wallets'

// Get RPC URL from environment variables
const rpcUrl = import.meta.env.VITE_RPC_URL || 'http://localhost:8545'

// Configure chains & providers
const { chains, provider, webSocketProvider } = configureChains(
  [
    // Add networks based on environment
    ...(import.meta.env.DEV ? [hardhat] : []),
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
const { wallets } = getDefaultWallets({
  appName: 'TicketChain',
  projectId: 'ticketchain', // Wallet Connect project ID
  chains,
})

// Add more wallet options beyond the defaults
const connectors = connectorsForWallets([
  ...wallets,
  {
    groupName: 'More Wallets',
    wallets: [
      injectedWallet({ chains }),
      metaMaskWallet({ projectId: 'ticketchain', chains }),
      coinbaseWallet({ appName: 'TicketChain', chains }),
      walletConnectWallet({ projectId: 'ticketchain', chains }),
    ],
  },
])

// Create the Wagmi client
export const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider,
})

export { chains }
