module.exports = async function globalTeardown() {
  console.log('Cleaning up...');
  
  // Close browser if still open
  if (global.browser) {
    try {
      await global.browser.close();
    } catch (e) {
      // Browser may already be closed
    }
  }
  
  // Kill dev server
  if (global.serverProcess) {
    global.serverProcess.kill();
  }
  
  console.log('Global teardown complete');
};