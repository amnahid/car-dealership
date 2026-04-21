const { config, viewports, screenshot, screenshotOnFailure, getCurrentUrl, setViewport } = require('../config');

describe('11 - Responsive Testing', () => {
  let page;

  beforeAll(async () => {
    page = await global.browser.newPage();
  });

  afterAll(async () => {
    if (page) await page.close();
  });

  describe('Desktop Viewport (1920x1080)', () => {
    test('Dashboard loads properly on Desktop', async () => {
      try {
        await setViewport(page, 'desktop');
        await page.goto(`${config.baseUrl}${config.paths.dashboard}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'desktop-dashboard', 'desktop');
        const sidebar = await page.$('[class*="sidebar"], nav, aside');
        expect(sidebar).not.toBeNull();
      } catch (error) {
        await screenshotOnFailure(page, 'desktop-dashboard', error, 'desktop');
        throw error;
      }
    });

    test('Cars list loads properly on Desktop', async () => {
      try {
        await setViewport(page, 'desktop');
        await page.goto(`${config.baseUrl}${config.paths.cars}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'desktop-cars', 'desktop');
      } catch (error) {
        await screenshotOnFailure(page, 'desktop-cars', error, 'desktop');
        throw error;
      }
    });

    test('Documents list loads properly on Desktop', async () => {
      try {
        await setViewport(page, 'desktop');
        await page.goto(`${config.baseUrl}${config.paths.documents}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'desktop-documents', 'desktop');
      } catch (error) {
        await screenshotOnFailure(page, 'desktop-documents', error, 'desktop');
        throw error;
      }
    });

    test('Rentals list loads properly on Desktop', async () => {
      try {
        await setViewport(page, 'desktop');
        await page.goto(`${config.baseUrl}${config.paths.rentals}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'desktop-rentals', 'desktop');
      } catch (error) {
        await screenshotOnFailure(page, 'desktop-rentals', error, 'desktop');
        throw error;
      }
    });
  });

  describe('Tablet Viewport (768x1024)', () => {
    test('Dashboard loads properly on Tablet', async () => {
      try {
        await setViewport(page, 'tablet');
        await page.goto(`${config.baseUrl}${config.paths.dashboard}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'tablet-dashboard', 'tablet');
        const sidebar = await page.$('[class*="sidebar"], nav, aside');
        await screenshot(page, 'tablet-dashboard-nav', 'tablet');
      } catch (error) {
        await screenshotOnFailure(page, 'tablet-dashboard', error, 'tablet');
        throw error;
      }
    });

    test('Cars list loads properly on Tablet', async () => {
      try {
        await setViewport(page, 'tablet');
        await page.goto(`${config.baseUrl}${config.paths.cars}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'tablet-cars', 'tablet');
      } catch (error) {
        await screenshotOnFailure(page, 'tablet-cars', error, 'tablet');
        throw error;
      }
    });

    test('Documents list loads properly on Tablet', async () => {
      try {
        await setViewport(page, 'tablet');
        await page.goto(`${config.baseUrl}${config.paths.documents}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'tablet-documents', 'tablet');
      } catch (error) {
        await screenshotOnFailure(page, 'tablet-documents', error, 'tablet');
        throw error;
      }
    });

    test('Rentals list loads properly on Tablet', async () => {
      try {
        await setViewport(page, 'tablet');
        await page.goto(`${config.baseUrl}${config.paths.rentals}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'tablet-rentals', 'tablet');
      } catch (error) {
        await screenshotOnFailure(page, 'tablet-rentals', error, 'tablet');
        throw error;
      }
    });
  });

  describe('Mobile Viewport (375x667)', () => {
    test('Dashboard loads properly on Mobile', async () => {
      try {
        await setViewport(page, 'mobile');
        await page.goto(`${config.baseUrl}${config.paths.dashboard}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'mobile-dashboard', 'mobile');
      } catch (error) {
        await screenshotOnFailure(page, 'mobile-dashboard', error, 'mobile');
        throw error;
      }
    });

    test('Cars list loads properly on Mobile', async () => {
      try {
        await setViewport(page, 'mobile');
        await page.goto(`${config.baseUrl}${config.paths.cars}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'mobile-cars', 'mobile');
      } catch (error) {
        await screenshotOnFailure(page, 'mobile-cars', error, 'mobile');
        throw error;
      }
    });

    test('Documents list loads properly on Mobile', async () => {
      try {
        await setViewport(page, 'mobile');
        await page.goto(`${config.baseUrl}${config.paths.documents}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'mobile-documents', 'mobile');
      } catch (error) {
        await screenshotOnFailure(page, 'mobile-documents', error, 'mobile');
        throw error;
      }
    });

    test('Rentals list loads properly on Mobile', async () => {
      try {
        await setViewport(page, 'mobile');
        await page.goto(`${config.baseUrl}${config.paths.rentals}`, { waitUntil: 'networkidle0' });
        await screenshot(page, 'mobile-rentals', 'mobile');
      } catch (error) {
        await screenshotOnFailure(page, 'mobile-rentals', error, 'mobile');
        throw error;
      }
    });
  });

  describe('Responsive Navigation', () => {
    test('Sidebar behavior on different viewports', async () => {
      const sizes = ['desktop', 'tablet', 'mobile'];
      
      for (const size of sizes) {
        try {
          await setViewport(page, size);
          await page.goto(`${config.baseUrl}${config.paths.dashboard}`, { waitUntil: 'networkidle0' });
          await page.waitForTimeout(500);
          await screenshot(page, `nav-${size}`, size);
        } catch (error) {
          await screenshotOnFailure(page, `nav-${size}`, error, size);
        }
      }
    });

    test('Button visibility on different viewports', async () => {
      const sizes = ['desktop', 'tablet', 'mobile'];
      
      for (const size of sizes) {
        try {
          await setViewport(page, size);
          await page.goto(`${config.baseUrl}${config.paths.cars}`, { waitUntil: 'networkidle0' });
          const addButton = await page.$('a[href*="/dashboard/cars/new"]');
          await screenshot(page, `buttons-${size}`, size);
        } catch (error) {
          await screenshotOnFailure(page, `buttons-${size}`, error, size);
        }
      }
    });

    test('Table/card layout adapts to viewport', async () => {
      const sizes = ['desktop', 'tablet', 'mobile'];
      
      for (const size of sizes) {
        try {
          await setViewport(page, size);
          await page.goto(`${config.baseUrl}${config.paths.customers}`, { waitUntil: 'networkidle0' });
          await page.waitForTimeout(500);
          await screenshot(page, `layout-${size}`, size);
        } catch (error) {
          await screenshotOnFailure(page, `layout-${size}`, error, size);
        }
      }
    });
  });
});