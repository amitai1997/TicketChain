// Global error handling utility
export const setupErrorHandling = () => {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Unhandled error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', {
      reason: event.reason,
      promise: event.promise
    });
    
    // Prevent default error handling
    event.preventDefault();
  });

  // Network error handling
  window.addEventListener('offline', () => {
    console.warn('Network connection lost');
  });

  window.addEventListener('online', () => {
    console.log('Network connection restored');
  });
}

// Enhanced logging for blockchain-related errors
export const logBlockchainError = (context: string, error: any) => {
  console.error(`Blockchain Error (${context}):`, {
    name: error.name,
    message: error.message,
    code: error.code,
    reason: error.reason,
    stack: error.stack,
    details: error.details || 'No additional details'
  });
}
