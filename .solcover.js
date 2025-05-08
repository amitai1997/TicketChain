module.exports = {
  skipFiles: ['interfaces/', 'mocks/'],
  istanbulReporter: ['html', 'lcov', 'text', 'json'],
  configureYulOptimizer: false,
  mocha: {
    timeout: 100000,
  }
};