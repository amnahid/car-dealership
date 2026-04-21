const { spawn } = require('child_process');
const path = require('path');
const puppeteer = require('puppeteer');

let serverProcess = null;
let browser = null;

module.exports = async function globalSetup() {
  console.log('Starting dev server...');

  serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..', '..'),
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, PORT: '3000' }
  });

  global.serverProcess = serverProcess;

  let serverReady = false;
  let attempts = 0;
  const maxAttempts = 90;

  while (!serverReady && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;

    try {
      const response = await fetch('http://localhost:3000');
      if (response.ok) {
        serverReady = true;
        console.log('Dev server is ready!');
      }
    } catch (e) {
      // Server not ready yet
    }
  }

  if (!serverReady) {
    throw new Error('Dev server failed to start within timeout');
  }

  console.log('Launching browser for tests...');
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  global.browser = browser;

  // Enable session persistence
  const context = browser.defaultBrowserContext();
  
  // Set default viewport to desktop
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  console.log('Viewport set to: Desktop (1920x1080)');
  await page.close();

  // Login and stay logged in for all tests
  const loginPage = await browser.newPage();
  await loginPage.setViewport({ width: 1920, height: 1080 });
  await loginPage.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle0' });
  await loginPage.type('#email', 'admin@dealership.com');
  await loginPage.type('#password', 'admin123');
  await loginPage.click('button[type="submit"]');
  await loginPage.waitForNavigation({ waitUntil: 'networkidle0' });
  console.log('Logged in successfully');
  await loginPage.close();
  
  console.log('Global setup complete');
};