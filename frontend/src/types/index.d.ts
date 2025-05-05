// Allow importing JSON files
declare module '*.json' {
  const value: any;
  export default value;
}

// Add window.ethereum type for MetaMask
interface Window {
  ethereum?: any;
}
