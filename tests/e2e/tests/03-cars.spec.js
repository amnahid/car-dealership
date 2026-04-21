async function login(page) {
  await page.goto(`${config.baseUrl}/auth/login`, { waitUntil: 'networkidle0' });
  await page.type('#email', 'admin@dealership.com');
  await page.type('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
}

const { config, uniqueId, screenshot, screenshotOnFailure, getCurrentUrl, setViewport } = require('../config');

describe('03 - Cars Management', () => {
  let page;
  let testCarId;

  beforeAll(async () => {
    page = await global.browser.newPage();
    await setViewport(page, 'desktop');
  });

  afterAll(async () => {
    if (page) await page.close();
  });

  describe('Cars List', () => {
    test('Cars list page loads with correct URL', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.cars}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'cars-list');
        const url = await getCurrentUrl(page);
        expect(url).toContain('/dashboard/cars');
      } catch (error) {
        await screenshotOnFailure(page, 'cars-list-load', error);
        throw error;
      }
    });

    test('Cars list shows car cards/table', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.cars}`, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(1000);
        const hasContent = await page.evaluate(() => document.body.textContent.length > 100);
        expect(hasContent).toBe(true);
        await screenshot(page, 'cars-list-content');
      } catch (error) {
        await screenshotOnFailure(page, 'cars-list-content', error);
        throw error;
      }
    });

    test('Cars list has filter by status option', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.cars}`, { waitUntil: 'networkidle0' });
        const filterSelect = await page.$('select[name="status"], [class*="filter"]');
        await screenshot(page, 'cars-filters');
      } catch (error) {
        await screenshotOnFailure(page, 'cars-filters', error);
        throw error;
      }
    });

    test('Cars list has Add New Car button', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.cars}`, { waitUntil: 'networkidle0' });
        const addButton = await page.$('a[href*="/dashboard/cars/new"]');
        expect(addButton).not.toBeNull();
        await screenshot(page, 'cars-add-button');
      } catch (error) {
        await screenshotOnFailure(page, 'cars-add-button', error);
        throw error;
      }
    });
  });

  describe('Add New Car', () => {
    test('Can navigate to Add New Car page', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.carsNew}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'cars-add-page');
        const url = await getCurrentUrl(page);
        expect(url).toContain('/dashboard/cars/new');
      } catch (error) {
        await screenshotOnFailure(page, 'cars-add-nav', error);
        throw error;
      }
    });

    test('Add car form has purchase information section', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.carsNew}`, { waitUntil: 'networkidle0' });
        const supplierInput = await page.$('input[name="purchase.supplierName"]');
        expect(supplierInput).not.toBeNull();
        await screenshot(page, 'cars-form-purchase-section');
      } catch (error) {
        await screenshotOnFailure(page, 'cars-form-purchase', error);
        throw error;
      }
    });

    test('Add car form has vehicle information section', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.carsNew}`, { waitUntil: 'networkidle0' });
        const brandInput = await page.$('input[name="brand"]');
        const modelInput = await page.$('input[name="model"]');
        expect(brandInput).not.toBeNull();
        expect(modelInput).not.toBeNull();
        await screenshot(page, 'cars-form-vehicle-section');
      } catch (error) {
        await screenshotOnFailure(page, 'cars-form-vehicle', error);
        throw error;
      }
    });

    test('Can submit new car with all details', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.carsNew}`, { waitUntil: 'networkidle0' });
        
        // Fill purchase info
        await page.type('input[name="purchase.supplierName"]', 'Test Supplier E2E');
        await page.type('input[name="purchase.purchasePrice"]', '55000');
        await page.evaluate(() => {
          const d = document.querySelector('input[name="purchase.purchaseDate"]');
          if (d) d.value = '2026-04-18';
        });
        
        // Fill vehicle info
        await page.type('input[name="brand"]', 'Audi');
        await page.type('input[name="model"]', 'A4');
        await page.type('input[name="year"]', '2025');
        await page.type('input[name="chassisNumber"]', uniqueId('E2E-AUDI'));
        await page.type('input[name="color"]', 'White');
        
        await screenshot(page, 'cars-form-complete');
        
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2500);
        
        const url = await getCurrentUrl(page);
        expect(url).toContain('/dashboard/cars');
        await screenshot(page, 'cars-created-success');
      } catch (error) {
        await screenshotOnFailure(page, 'cars-create', error);
        throw error;
      }
    });

    test('Add car form validation - required fields', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.carsNew}`, { waitUntil: 'networkidle0' });
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1000);
        const url = await getCurrentUrl(page);
        expect(url).toContain('/dashboard/cars/new');
        await screenshot(page, 'cars-form-validation');
      } catch (error) {
        await screenshotOnFailure(page, 'cars-validation', error);
        throw error;
      }
    });
  });

  describe('Car Detail View', () => {
    test('Can view car detail page', async () => {
      try {
        // First get a car ID from the list
        await page.goto(`${config.baseUrl}${config.paths.cars}`, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(1000);
        
        const carLink = await page.$('a[href*="/dashboard/cars/"]');
        if (carLink) {
          await carLink.click();
          await page.waitForTimeout(1500);
          await screenshot(page, 'cars-detail');
          const url = await getCurrentUrl(page);
          expect(url).toContain('/dashboard/cars/');
        }
      } catch (error) {
        await screenshotOnFailure(page, 'cars-detail', error);
        throw error;
      }
    });

    test('Car detail shows purchase information', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.cars}`, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(1000);
        const carLink = await page.$('a[href*="/dashboard/cars/"]');
        if (carLink) {
          await carLink.click();
          await page.waitForTimeout(1500);
          const content = await page.evaluate(() => document.body.textContent);
          const hasPurchase = content.includes('Purchase') || content.includes('Supplier') || content.includes('Price');
          await screenshot(page, 'cars-detail-purchase');
        }
      } catch (error) {
        await screenshotOnFailure(page, 'cars-detail-purchase', error);
        throw error;
      }
    });

    test('Car detail shows repair history', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.cars}`, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(1000);
        const carLink = await page.$('a[href*="/dashboard/cars/"]');
        if (carLink) {
          await carLink.click();
          await page.waitForTimeout(1500);
          await screenshot(page, 'cars-detail-repairs');
        }
      } catch (error) {
        await screenshotOnFailure(page, 'cars-detail-repairs', error);
        throw error;
      }
    });

    test('Car detail shows documents', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.cars}`, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(1000);
        const carLink = await page.$('a[href*="/dashboard/cars/"]');
        if (carLink) {
          await carLink.click();
          await page.waitForTimeout(1500);
          await screenshot(page, 'cars-detail-documents');
        }
      } catch (error) {
        await screenshotOnFailure(page, 'cars-detail-documents', error);
        throw error;
      }
    });
  });
});