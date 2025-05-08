// @ts-check
import tsparser from '@typescript-eslint/parser';

const nodeGlobals = {
  process: false,
  __dirname: false,
  module: false,
  require: false,
  exports: false,
  console: false,
  Buffer: false,
  setTimeout: false,
  clearTimeout: false,
  setInterval: false,
  clearInterval: false,
};
const browserGlobals = {
  window: false,
  document: false,
  navigator: false,
  location: false,
  fetch: false,
  console: false,
  Node: false,
  HTMLInputElement: false,
  HTMLSelectElement: false,
  HTMLDivElement: false,
  MouseEvent: false,
  JSX: false,
  localStorage: false,
  setTimeout: false,
};
const mochaGlobals = {
  describe: false,
  it: false,
  before: false,
  beforeEach: false,
  after: false,
  afterEach: false,
  context: false,
  expect: false,
};

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: [
      '**/node_modules/**',
      // TEMP: Only ignore node_modules to debug ignore pattern issue
    ],
  },
  {
    files: [
      '*.js',
      '*.cjs',
      '*.mjs',
      '*.ts',
      '*.cts',
      '*.mts',
      'scripts/**/*',
      'test/**/*',
      'hardhat.config.*',
      '*.config.*',
    ],
    languageOptions: {
      parser: tsparser,
      globals: { ...nodeGlobals },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'no-explicit-any': 'off',
    },
  },
  {
    files: ['frontend/src/**/*.ts', 'frontend/src/**/*.tsx', 'src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      globals: { ...browserGlobals },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['test/**/*.test.ts', 'test/**/*.test.js', 'test/**/*.spec.ts', 'test/**/*.spec.js'],
    languageOptions: {
      parser: tsparser,
      globals: { ...nodeGlobals, ...mochaGlobals },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-explicit-any': 'off',
    },
  },
];
