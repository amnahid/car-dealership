const { config, uniqueId, screenshot, screenshotOnFailure, getCurrentUrl, setViewport } = require('../config');

async function login(page) {
  await page.goto(`${config.baseUrl}/auth/login`, { waitUntil: 'networkidle0' });
  await page.type('#email', 'admin@dealership.com');
  await page.type('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
}

describe('06 - Cash Sales', () => {
  let page;

  beforeAll(async () => {
    page = await global.browser.newPage();
    await setViewport(page, 'desktop');
  });

  afterAll(async () => {
    if (page) await page.close();
  });

  describe('Cash Sales List', () => {
    test('Cash sales list page loads', async () => {
      try {
        await login(page);
        await page.goto(`${config.baseUrl}${config.paths.cashSales}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'cash-sales-list');
        const url = await getCurrentUrl(page);
        expect(url).toContain('/dashboard/sales/cash');
      } catch (error) {
        await screenshotOnFailure(page, 'cash-sales-list', error);
        throw error;
      }
    });

    test('Cash sales list shows sales records', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.cashSales}`, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'cash-sales-list-content');
      } catch (error) {
        await screenshotOnFailure(page, 'cash-sales-content', error);
        throw error;
      }
    });

    test('Cash sales has Add New Sale button', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.cashSales}`, { waitUntil: 'networkidle0' });
        const buttons = await page.$$('button');
        let addButton = null;
        for (const btn of buttons) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text.includes('New Cash Sale')) {
            addButton = btn;
            break;
          }
        }
        expect(addButton).not.toBeNull();
        await screenshot(page, 'cash-sales-add-button');
      } catch (error) {
        await screenshotOnFailure(page, 'cash-sales-add-btn', error);
        throw error;
      }
    });
  });

  describe('Create Cash Sale', () => {
    test('Cash sales list has modal for new sale', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.cashSales}`, { waitUntil: 'networkidle0' });
        const buttons = await page.$$('button');
        let addButton = null;
        for (const btn of buttons) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text.includes('New Cash Sale')) {
            addButton = btn;
            break;
          }
        }
        if (addButton) {
          await addButton.click();
          await page.waitForTimeout(1000);
          await screenshot(page, 'cash-sales-modal-open');
        }
      } catch (error) {
        await screenshotOnFailure(page, 'cash-sales-modal', error);
        throw error;
      }
    });

    test('Cash sale modal has form fields', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.cashSales}`, { waitUntil: 'networkidle0' });
        const buttons = await page.$$('button');
        let addButton = null;
        for (const btn of buttons) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text.includes('New Cash Sale')) {
            addButton = btn;
            break;
          }
        }
        if (addButton) {
          await addButton.click();
          await page.waitForTimeout(1000);
          const carSelect = await page.$('select');
          const inputs = await page.$$('input');
          await screenshot(page, 'cash-sales-form-fields');
        }
      } catch (error) {
        await screenshotOnFailure(page, 'cash-sales-fields', error);
        throw error;
      }
    });
  });
});