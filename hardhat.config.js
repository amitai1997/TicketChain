require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    resolveJsonModule: true,
    esModuleInterop: true,
  },
});
module.exports = require('./hardhat.config.ts');
