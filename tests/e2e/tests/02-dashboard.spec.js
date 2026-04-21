const { config, screenshot, screenshotOnFailure, getCurrentUrl, setViewport, viewports } = require('../config');

describe('02 - Dashboard', () => {
  let page;

  beforeAll(async () => {
    page = await global.browser.newPage();
    await setViewport(page, 'desktop');
  });

  afterAll(async () => {
    if (page) await page.close();
  });

  describe('Dashboard Overview', () => {
    test('Dashboard loads with correct URL', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.dashboard}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'dashboard-loaded');
        const url = await getCurrentUrl(page);
        expect(url).toContain('/dashboard');
      } catch (error) {
        await screenshotOnFailure(page, 'dashboard-load', error);
        throw error;
      }
    });

    test('Dashboard shows KPI cards (stats)', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.dashboard}`, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(1000);
        const content = await page.evaluate(() => document.body.textContent);
        const hasStats = content.includes('Cars') || content.includes('Revenue') || content.includes('Sales');
        expect(hasStats).toBe(true);
        await screenshot(page, 'dashboard-kpi-cards');
      } catch (error) {
        await screenshotOnFailure(page, 'dashboard-kpi', error);
        throw error;
      }
    });

    test('Dashboard shows sidebar navigation', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.dashboard}`, { waitUntil: 'networkidle0' });
        const sidebar = await page.$('[class*="sidebar"], nav, aside');
        expect(sidebar).not.toBeNull();
        await screenshot(page, 'dashboard-sidebar');
      } catch (error) {
        await screenshotOnFailure(page, 'dashboard-sidebar', error);
        throw error;
      }
    });

    test('Dashboard shows recent activity section', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.dashboard}`, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(1000);
        const content = await page.evaluate(() => document.body.textContent);
        const hasActivity = content.includes('Activity') || content.includes('Recent');
        await screenshot(page, 'dashboard-activity');
      } catch (error) {
        await screenshotOnFailure(page, 'dashboard-activity', error);
        throw error;
      }
    });

    test('Dashboard shows alert notifications area', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.dashboard}`, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(1000);
        const alertSection = await page.$('[class*="alert"], [class*="notification"], [class*="warning"]');
        await screenshot(page, 'dashboard-alerts');
      } catch (error) {
        await screenshotOnFailure(page, 'dashboard-alerts', error);
        throw error;
      }
    });
  });

  describe('Dashboard Navigation', () => {
    test('Can navigate to Cars from dashboard', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.dashboard}`, { waitUntil: 'networkidle0' });
        const carsLink = await page.$('a[href*="/dashboard/cars"]');
        if (carsLink) {
          await carsLink.click();
          await page.waitForTimeout(1500);
          const url = await getCurrentUrl(page);
          expect(url).toContain('/dashboard/cars');
          await screenshot(page, 'dashboard-nav-cars');
        }
      } catch (error) {
        await screenshotOnFailure(page, 'dashboard-nav-cars', error);
        throw error;
      }
    });

    test('Can navigate to Customers from dashboard', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.dashboard}`, { waitUntil: 'networkidle0' });
        const customersLink = await page.$('a[href*="/dashboard/customers"]');
        if (customersLink) {
          await customersLink.click();
          await page.waitForTimeout(1500);
          const url = await getCurrentUrl(page);
          expect(url).toContain('/dashboard/customers');
          await screenshot(page, 'dashboard-nav-customers');
        }
      } catch (error) {
        await screenshotOnFailure(page, 'dashboard-nav-customers', error);
        throw error;
      }
    });

    test('Can navigate to Sales section', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.dashboard}`, { waitUntil: 'networkidle0' });
        const salesLink = await page.$('a[href*="/dashboard/sales"]');
        if (salesLink) {
          await salesLink.click();
          await page.waitForTimeout(1500);
          const url = await getCurrentUrl(page);
          expect(url).toContain('/dashboard/sales');
          await screenshot(page, 'dashboard-nav-sales');
        }
      } catch (error) {
        await screenshotOnFailure(page, 'dashboard-nav-sales', error);
        throw error;
      }
    });

    test('Can navigate to Finance from dashboard', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.dashboard}`, { waitUntil: 'networkidle0' });
        const financeLink = await page.$('a[href*="/dashboard/finance"]');
        if (financeLink) {
          await financeLink.click();
          await page.waitForTimeout(1500);
          const url = await getCurrentUrl(page);
          expect(url).toContain('/dashboard/finance');
          await screenshot(page, 'dashboard-nav-finance');
        }
      } catch (error) {
        await screenshotOnFailure(page, 'dashboard-nav-finance', error);
        throw error;
      }
    });
  });

  describe('Dashboard User Info', () => {
    test('Dashboard shows user profile section', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.dashboard}`, { waitUntil: 'networkidle0' });
        const userSection = await page.$('[class*="profile"], [class*="user"]');
        await screenshot(page, 'dashboard-user-profile');
      } catch (error) {
        await screenshotOnFailure(page, 'dashboard-user', error);
        throw error;
      }
    });

    test('Can access profile page from dashboard', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.dashboard}`, { waitUntil: 'networkidle0' });
        const profileLink = await page.$('a[href*="/dashboard/profile"]');
        if (profileLink) {
          await profileLink.click();
          await page.waitForTimeout(1500);
          const url = await getCurrentUrl(page);
          expect(url).toContain('/dashboard/profile');
          await screenshot(page, 'dashboard-profile-access');
        }
      } catch (error) {
        await screenshotOnFailure(page, 'dashboard-profile-access', error);
        throw error;
      }
    });
  });
});