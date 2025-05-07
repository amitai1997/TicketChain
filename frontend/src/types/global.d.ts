// Global type declarations for the application

// Window with ethereum provider
interface Window {
  ethereum: any;
  testContract?: () => Promise<any>;
  getDebugInfo?: () => any;
  fetch: typeof fetch;
}

// Environment variables from Vite
interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS: string;
  readonly VITE_RPC_URL: string;
  readonly VITE_ENVIRONMENT: string;
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
