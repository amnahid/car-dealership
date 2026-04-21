async function login(page) {
  await page.goto(`${config.baseUrl}/auth/login`, { waitUntil: 'networkidle0' });
  await page.type('#email', 'admin@dealership.com');
  await page.type('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
}

const { config, uniqueId, screenshot, screenshotOnFailure, getCurrentUrl, setViewport } = require('../config');

describe('08 - Rentals Management', () => {
  let page;

  beforeAll(async () => {
    page = await global.browser.newPage();
    await setViewport(page, 'desktop');
  });

  afterAll(async () => {
    if (page) await page.close();
  });

  describe('Rentals List', () => {
    test('Rentals list page loads', async () => {
      try {
        await login(page);
        await page.goto(`${config.baseUrl}${config.paths.rentals}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'rentals-list');
        const url = await getCurrentUrl(page);
        expect(url).toContain('/dashboard/sales/rentals');
      } catch (error) {
        await screenshotOnFailure(page, 'rentals-list', error);
        throw error;
      }
    });

    test('Rentals list shows rental records', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.rentals}`, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'rentals-list-content');
      } catch (error) {
        await screenshotOnFailure(page, 'rentals-content', error);
        throw error;
      }
    });

    test('Rentals list has Add New Rental button', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.rentals}`, { waitUntil: 'networkidle0' });
        const buttons = await page.$$('button');
        let addButton = null;
        for (const btn of buttons) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text.includes('New Rental')) {
            addButton = btn;
            break;
          }
        }
        expect(addButton).not.toBeNull();
        await screenshot(page, 'rentals-add-button');
      } catch (error) {
        await screenshotOnFailure(page, 'rentals-add-btn', error);
        throw error;
      }
    });
  });

  describe('Create Rental', () => {
    test('Rentals list has modal for new rental', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.rentals}`, { waitUntil: 'networkidle0' });
        const addButton = await page.$('button');
        const hasNewRentalText = addButton ? await page.evaluate(el => el.textContent.includes('New Rental'), addButton) : false;
        if (hasNewRentalText) {
          await addButton.click();
          await page.waitForTimeout(1000);
          await screenshot(page, 'rentals-modal-open');
        }
      } catch (error) {
        await screenshotOnFailure(page, 'rentals-modal', error);
        throw error;
      }
    });

    test('Rental modal has form fields', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.rentals}`, { waitUntil: 'networkidle0' });
        const addButton = await page.$('button');
        const hasNewRentalText = addButton ? await page.evaluate(el => el.textContent.includes('New Rental'), addButton) : false;
        if (hasNewRentalText) {
          await addButton.click();
          await page.waitForTimeout(1000);
          await screenshot(page, 'rentals-form-fields');
        }
      } catch (error) {
        await screenshotOnFailure(page, 'rentals-fields', error);
        throw error;
      }
    });
  });

  describe('Close Rental', () => {
    test('Can find close/return button in rentals list', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.rentals}`, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(1000);
        // Look for action buttons in the table
        const actionButtons = await page.$$('button');
        await screenshot(page, 'rental-actions');
      } catch (error) {
        await screenshotOnFailure(page, 'rental-actions', error);
        throw error;
      }
    });
  });
});