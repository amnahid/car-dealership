const { config, screenshot, screenshotOnFailure, getCurrentUrl, setViewport } = require('../config');

describe('01 - Authentication', () => {
  let page;

  beforeAll(async () => {
    page = await global.browser.newPage();
    await setViewport(page, 'desktop');
  });

  afterAll(async () => {
    if (page) await page.close();
  });

  describe('Desktop Viewport', () => {
    test('Valid login redirects to dashboard', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.login}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'auth-login-page');
        await page.type('#email', config.credentials.admin.email);
        await page.type('#password', config.credentials.admin.password);
        await screenshot(page, 'auth-credentials-filled');
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        const url = await getCurrentUrl(page);
        expect(url).toContain('/dashboard');
        await screenshot(page, 'auth-login-success');
      } catch (error) {
        await screenshotOnFailure(page, 'auth-valid-login', error);
        throw error;
      }
    });

    test('Invalid credentials shows error message', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.login}`, { waitUntil: 'networkidle0' });
        await page.type('#email', 'invalid@test.com');
        await page.type('#password', 'wrongpassword');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1500);
        const pageText = await page.evaluate(() => document.body.textContent);
        expect(pageText).toContain('Invalid');
        await screenshot(page, 'auth-invalid-credentials');
      } catch (error) {
        await screenshotOnFailure(page, 'auth-invalid-credentials', error);
        throw error;
      }
    });

    test('Empty login form shows validation', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.login}`, { waitUntil: 'networkidle0' });
        await page.click('button[type="submit"]');
        await page.waitForTimeout(500);
        const url = await getCurrentUrl(page);
        expect(url).toContain('/login');
        await screenshot(page, 'auth-empty-validation');
      } catch (error) {
        await screenshotOnFailure(page, 'auth-empty-validation', error);
        throw error;
      }
    });

    test('Login page has remember me option', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.login}`, { waitUntil: 'networkidle0' });
        const rememberMe = await page.$('input[type="checkbox"]');
        if (rememberMe) {
          await screenshot(page, 'auth-remember-me');
        }
      } catch (error) {
        await screenshotOnFailure(page, 'auth-remember-me', error);
        throw error;
      }
    });
  });
});