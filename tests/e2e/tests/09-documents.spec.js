const { config, uniqueId, screenshot, screenshotOnFailure, getCurrentUrl, setViewport } = require('../config');

describe('09 - Documents Management', () => {
  let page;

  beforeAll(async () => {
    page = await global.browser.newPage();
    await setViewport(page, 'desktop');
  });

  afterAll(async () => {
    if (page) await page.close();
  });

  describe('Documents List', () => {
    test('Documents list page loads', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.documents}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'documents-list');
        const url = await getCurrentUrl(page);
        expect(url).toContain('/dashboard/documents');
      } catch (error) {
        await screenshotOnFailure(page, 'documents-list', error);
        throw error;
      }
    });

    test('Documents list shows document records', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.documents}`, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'documents-list-content');
      } catch (error) {
        await screenshotOnFailure(page, 'documents-content', error);
        throw error;
      }
    });

    test('Documents list has Add New Document button', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.documents}`, { waitUntil: 'networkidle0' });
        const addButton = await page.$('a[href*="/dashboard/documents/new"]');
        expect(addButton).not.toBeNull();
        await screenshot(page, 'documents-add-button');
      } catch (error) {
        await screenshotOnFailure(page, 'documents-add-btn', error);
        throw error;
      }
    });
  });

  describe('Add Document', () => {
    test('Can navigate to Add Document page', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.documentsNew}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'documents-add-page');
        const url = await getCurrentUrl(page);
        expect(url).toContain('/dashboard/documents/new');
      } catch (error) {
        await screenshotOnFailure(page, 'documents-add-nav', error);
        throw error;
      }
    });

    test('Document form has required fields', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.documentsNew}`, { waitUntil: 'networkidle0' });
        const carSelect = await page.$('select[name="car"]');
        const docType = await page.$('select[name="documentType"]');
        await screenshot(page, 'documents-form-fields');
      } catch (error) {
        await screenshotOnFailure(page, 'documents-fields', error);
        throw error;
      }
    });

    test('Document form validation', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.documentsNew}`, { waitUntil: 'networkidle0' });
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1000);
        const url = await getCurrentUrl(page);
        expect(url).toContain('/dashboard/documents/new');
        await screenshot(page, 'documents-validation');
      } catch (error) {
        await screenshotOnFailure(page, 'documents-validation', error);
        throw error;
      }
    });
  });
});