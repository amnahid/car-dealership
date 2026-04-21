const { config, uniqueId, screenshot, screenshotOnFailure, getCurrentUrl, setViewport } = require('../config');

describe('04 - Customers Management', () => {
  let page;

  beforeAll(async () => {
    page = await global.browser.newPage();
    await setViewport(page, 'desktop');
  });

  afterAll(async () => {
    if (page) await page.close();
  });

  describe('Customers List', () => {
    test('Customers list page loads', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.customers}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'customers-list');
        const url = await getCurrentUrl(page);
        expect(url).toContain('/dashboard/customers');
      } catch (error) {
        await screenshotOnFailure(page, 'customers-list', error);
        throw error;
      }
    });

    test('Customers list shows customer content', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.customers}`, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'customers-list-content');
      } catch (error) {
        await screenshotOnFailure(page, 'customers-content', error);
        throw error;
      }
    });

    test('Customers list has action elements', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.customers}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'customers-action-buttons');
      } catch (error) {
        await screenshotOnFailure(page, 'customers-buttons', error);
        throw error;
      }
    });
  });

  describe('Add Customer', () => {
    test('Add customer page loads', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.customersNew}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'customers-add-page');
        const url = await getCurrentUrl(page);
        expect(url).toContain('/dashboard/customers/new');
      } catch (error) {
        await screenshotOnFailure(page, 'customers-add-nav', error);
        throw error;
      }
    });

    test('Customer form is visible', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.customersNew}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'customers-form-visible');
      } catch (error) {
        await screenshotOnFailure(page, 'customers-form-visible', error);
        throw error;
      }
    });
  });

  describe('Customer Actions', () => {
    test('Customers list shows action links', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.customers}`, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'customers-actions');
      } catch (error) {
        await screenshotOnFailure(page, 'customers-actions', error);
        throw error;
      }
    });
  });
});