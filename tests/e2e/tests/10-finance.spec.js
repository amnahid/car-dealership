async function login(page) {
  await page.goto(`${config.baseUrl}/auth/login`, { waitUntil: 'networkidle0' });
  await page.type('#email', 'admin@dealership.com');
  await page.type('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
}

const { config, screenshot, screenshotOnFailure, getCurrentUrl, setViewport } = require('../config');

describe('10 - Finance', () => {
  let page;

  beforeAll(async () => {
    page = await global.browser.newPage();
    await setViewport(page, 'desktop');
  });

  afterAll(async () => {
    if (page) await page.close();
  });

  describe('Finance Overview', () => {
    test('Finance page loads', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.finance}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'finance-page');
        const url = await getCurrentUrl(page);
        expect(url).toContain('/dashboard/finance');
      } catch (error) {
        await screenshotOnFailure(page, 'finance-page', error);
        throw error;
      }
    });

    test('Finance page shows transactions', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.finance}`, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'finance-transactions');
      } catch (error) {
        await screenshotOnFailure(page, 'finance-transactions', error);
        throw error;
      }
    });

    test('Finance page shows summary/totals', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.finance}`, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'finance-summary');
      } catch (error) {
        await screenshotOnFailure(page, 'finance-summary', error);
        throw error;
      }
    });
  });

  describe('Financial Reports', () => {
    test('Can access financial reports', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.finance}`, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'finance-reports');
      } catch (error) {
        await screenshotOnFailure(page, 'finance-reports', error);
        throw error;
      }
    });
  });
});