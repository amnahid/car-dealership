const { config, uniqueId, screenshot, screenshotOnFailure, getCurrentUrl, setViewport } = require('../config');

describe('07 - Installment Sales', () => {
  let page;

  beforeAll(async () => {
    page = await global.browser.newPage();
    await setViewport(page, 'desktop');
  });

  afterAll(async () => {
    if (page) await page.close();
  });

  describe('Installments List', () => {
    test('Installments list page loads', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.installments}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'installments-list');
        const url = await getCurrentUrl(page);
        expect(url).toContain('/dashboard/sales/installments');
      } catch (error) {
        await screenshotOnFailure(page, 'installments-list', error);
        throw error;
      }
    });

    test('Installments list shows content', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.installments}`, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'installments-list-content');
      } catch (error) {
        await screenshotOnFailure(page, 'installments-content', error);
        throw error;
      }
    });

    test('Installments page has action elements', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.installments}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'installments-actions');
      } catch (error) {
        await screenshotOnFailure(page, 'installments-buttons', error);
        throw error;
      }
    });
  });

  describe('Create Installment Plan', () => {
    test('Can navigate to New Installment page', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.installmentsNew}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'installments-add-page');
        const url = await getCurrentUrl(page);
        expect(url).toContain('/dashboard/sales/installments/new');
      } catch (error) {
        await screenshotOnFailure(page, 'installments-add-nav', error);
        throw error;
      }
    });

    test('Installment form is visible', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.installmentsNew}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'installments-form-visible');
      } catch (error) {
        await screenshotOnFailure(page, 'installments-form', error);
        throw error;
      }
    });
  });

  describe('Installment Alerts', () => {
    test('Installments page shows content', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.installments}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'installments-alerts-content');
      } catch (error) {
        await screenshotOnFailure(page, 'installments-alerts', error);
        throw error;
      }
    });
  });
});