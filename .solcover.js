module.exports = {
  skipFiles: ['interfaces/', 'mocks/', 'TicketNFT.sol', 'libs/TicketValidation.sol'],
  istanbulReporter: ['html', 'lcov', 'text', 'json'],
  configureYulOptimizer: false,
  mocha: {
    timeout: 100000,
  }
};