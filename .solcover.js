module.exports = {
  skipFiles: ['mocks/'],
  istanbulReporter: ['html', 'lcov', 'text', 'json'],
  // Turn off the Yul optimizer during coverage
  // This helps with stack too deep errors
  configureYulOptimizer: false,
  mocha: {
    timeout: 100000,
  },
  // Only measure statement and line coverage
  // This reduces the instrumentation overhead significantly
  measureStatementCoverage: true,
  measureFunctionCoverage: true,
  measureLineCoverage: true,
  measureBranchCoverage: false,
  // Skip instrumenting complex functions that are likely to hit stack limits
  skipFunctionNames: [
    // Don't instrument burn/transfer logic
    '_burn',
    '_removeTokenFromAllTokens',
  ],
};
