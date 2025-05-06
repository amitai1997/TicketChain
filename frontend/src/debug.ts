// File: src/debug.ts
// This is a debugging utility that will be loaded via script tag
// to help diagnose contract connection issues

export const setupDebugTools = () => {
  console.log('Setting up debug tools');

  // Save the original fetch
  const originalFetch = window.fetch;

  // Override fetch to log requests
  window.fetch = function (...args) {
    console.log('Fetch call:', args);
    return originalFetch.apply(this, args);
  };

  // Add a global function to test contract interaction
  window.testContract = async () => {
    try {
      // Create an ethers provider
      if (!window.ethereum) {
        console.error('No ethereum provider available');
        return;
      }

      // Create provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const signerAddress = await signer.getAddress();
      console.log('Signer address:', signerAddress);

      // Import the ABI directly
      const response = await fetch('/artifacts/contracts/TicketNFT.sol/TicketNFT.json');
      const TicketNFTAbi = await response.json();
      console.log('Contract ABI loaded');

      // Try both contract addresses
      const addresses = [
        '0x0165878A594ca255338adfa4d48449f69242Eb8F', // New address from recent deployment
        '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Old address
      ];

      for (const addr of addresses) {
        console.log(`Testing contract at ${addr}`);
        try {
          // Create contract instance
          const contract = new ethers.Contract(addr, TicketNFTAbi.abi, provider);

          // Try to call a view function
          console.log('Testing totalSupply function...');
          const totalSupply = await contract.totalSupply();
          console.log(`Contract at ${addr} totalSupply: ${totalSupply.toString()}`);

          console.log('Testing MINTER_ROLE function...');
          const minterRole = await contract.MINTER_ROLE();
          console.log(`Contract at ${addr} MINTER_ROLE: ${minterRole}`);

          console.log('Testing hasRole function...');
          const hasRole = await contract.hasRole(minterRole, signerAddress);
          console.log(`Contract at ${addr} hasRole(MINTER_ROLE, ${signerAddress}): ${hasRole}`);

          // Contract at this address is working
          console.log(`Contract at ${addr} is operational!`);

          // Run a test mint
          console.log('Preparing to test mint function...');
          const contractWithSigner = contract.connect(signer);

          // Prepare metadata
          const metadata = {
            eventId: 1,
            price: ethers.utils.parseEther('0.01'),
            validFrom: Math.floor(Date.now() / 1000),
            validUntil: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
            isTransferable: true,
          };

          if (!hasRole) {
            console.log('Account does not have MINTER_ROLE, attempting to grant...');
            const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE();
            const isAdmin = await contract.hasRole(DEFAULT_ADMIN_ROLE, signerAddress);
            console.log(`Account has DEFAULT_ADMIN_ROLE: ${isAdmin}`);

            if (isAdmin) {
              console.log('Granting MINTER_ROLE...');
              const tx = await contractWithSigner.grantRole(minterRole, signerAddress);
              await tx.wait();
              console.log('MINTER_ROLE granted successfully');
            } else {
              console.error('Account is not an admin, cannot grant MINTER_ROLE');
            }
          }

          console.log('Testing mint function...');
          const tx = await contractWithSigner.mintTicket(
            signerAddress,
            totalSupply.add(1),
            metadata
          );

          console.log('Mint transaction submitted:', tx.hash);
          const receipt = await tx.wait();
          console.log('Mint transaction confirmed:', receipt);

          return {
            success: true,
            contractAddress: addr,
            totalSupply: totalSupply.toString(),
            minterRole,
            hasRole,
            hash: tx.hash,
          };
        } catch (error) {
          console.error(`Error with contract at ${addr}:`, error);
        }
      }

      // If we get here, neither contract address worked
      return {
        success: false,
        error: 'Failed to connect to contract at both addresses',
      };
    } catch (error) {
      console.error('Error in testContract:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  // Add debug info to window
  window.getDebugInfo = () => {
    return {
      ethereum: window.ethereum ? 'Available' : 'Not available',
      providerType: window.ethereum ? window.ethereum.constructor.name : 'None',
      isMetaMask: window.ethereum ? window.ethereum.isMetaMask : false,
      chainId: window.ethereum ? window.ethereum.chainId : 'Unknown',
      selectedAddress: window.ethereum ? window.ethereum.selectedAddress : 'Not connected',
      env: {
        contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || 'Not set',
        rpcUrl: import.meta.env.VITE_RPC_URL || 'Not set',
        environment: import.meta.env.VITE_ENVIRONMENT || 'Not set',
      },
    };
  };

  console.log('Debug tools ready! Call window.testContract() to test contract connection');
  console.log('Environment info:', window.getDebugInfo());
};

// Add types to window
declare global {
  interface Window {
    ethereum: any;
    testContract: () => Promise<any>;
    getDebugInfo: () => any;
    fetch: typeof fetch;
  }
}
