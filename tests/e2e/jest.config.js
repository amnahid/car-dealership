module.exports = {
  preset: 'jest-puppeteer',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/tests/**/*.spec.js'],
  testTimeout: 90000,
  reporters: ['default', 'summary'],
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  globalSetup: './global-setup.js',
  globalTeardown: './global-teardown.js',
};