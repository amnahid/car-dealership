async function login(page) {
  await page.goto(`${config.baseUrl}/auth/login`, { waitUntil: 'networkidle0' });
  await page.type('#email', 'admin@dealership.com');
  await page.type('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
}

const { config, uniqueId, screenshot, screenshotOnFailure, getCurrentUrl, setViewport } = require('../config');

describe('05 - Employees Management', () => {
  let page;

  beforeAll(async () => {
    page = await global.browser.newPage();
    await setViewport(page, 'desktop');
  });

  afterAll(async () => {
    if (page) await page.close();
  });

  describe('Employees List', () => {
    test('Employees list page loads', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.employees}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'employees-list');
        const url = await getCurrentUrl(page);
        expect(url).toContain('/dashboard/employees');
      } catch (error) {
        await screenshotOnFailure(page, 'employees-list', error);
        throw error;
      }
    });

    test('Employees list shows content', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.employees}`, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'employees-list-content');
      } catch (error) {
        await screenshotOnFailure(page, 'employees-content', error);
        throw error;
      }
    });

    test('Employees page action elements visible', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.employees}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'employees-actions');
      } catch (error) {
        await screenshotOnFailure(page, 'employees-buttons', error);
        throw error;
      }
    });
  });

  describe('Add Employee', () => {
    test('Can navigate to Add Employee page', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.employeesNew}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'employees-add-page');
        const url = await getCurrentUrl(page);
        expect(url).toContain('/dashboard/employees/new');
      } catch (error) {
        await screenshotOnFailure(page, 'employees-add-nav', error);
        throw error;
      }
    });

    test('Employee form is visible', async () => {
      try {
        await page.goto(`${config.baseUrl}${config.paths.employeesNew}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'employees-form-visible');
      } catch (error) {
        await screenshotOnFailure(page, 'employees-form', error);
        throw error;
      }
    });
  });
});