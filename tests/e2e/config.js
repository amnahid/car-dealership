const path = require('path');
const fs = require('fs');

const config = {
  baseUrl: 'http://localhost:3000',
  credentials: {
    admin: {
      email: 'admin@dealership.com',
      password: 'admin123',
      name: 'System Admin',
    },
  },
  timeouts: {
    default: 30000,
    navigation: 60000,
    wait: 10000,
  },
  paths: {
    login: '/auth/login',
    dashboard: '/dashboard',
    cars: '/dashboard/cars',
    carsNew: '/dashboard/cars/new',
    carsEdit: '/dashboard/cars/[id]/edit',
    customers: '/dashboard/customers',
    customersNew: '/dashboard/customers/new',
    employees: '/dashboard/employees',
    employeesNew: '/dashboard/employees/new',
    cashSales: '/dashboard/sales/cash',
    cashSalesNew: '/dashboard/sales/cash/new',
    installments: '/dashboard/sales/installments',
    installmentsNew: '/dashboard/sales/installments/new',
    rentals: '/dashboard/sales/rentals',
    rentalsNew: '/dashboard/sales/rentals/new',
    documents: '/dashboard/documents',
    documentsNew: '/dashboard/documents/new',
    finance: '/dashboard/finance',
    repairs: '/dashboard/repairs',
    repairsNew: '/dashboard/repairs/new',
    users: '/dashboard/users',
    profile: '/dashboard/profile',
    activityLogs: '/dashboard/activity-logs',
  },
};

const viewports = {
  desktop: { width: 1920, height: 1080, name: 'Desktop' },
  tablet: { width: 768, height: 1024, name: 'Tablet' },
  mobile: { width: 375, height: 667, name: 'Mobile' },
};

const testData = {
  timestamp: Date.now(),
  generateUniqueId: (prefix) => `${prefix}-${Date.now()}`,
};

function uniqueId(prefix) {
  return `${prefix}-${Date.now()}`;
}

function getScreenshotsDir() {
  const dir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

async function screenshot(page, name, viewport = 'desktop') {
  const dir = getScreenshotsDir();
  const fileName = `${viewport}-${name}-${Date.now()}.png`;
  const filePath = path.join(dir, fileName);
  
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`Screenshot saved: ${filePath}`);
  return filePath;
}

async function screenshotOnFailure(page, testName, error, viewport = 'desktop') {
  const dir = getScreenshotsDir();
  const fileName = `FAILURE-${viewport}-${testName}-${Date.now()}.png`;
  const filePath = path.join(dir, fileName);
  
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`FAILURE screenshot saved: ${filePath}`);
  console.log(`Error: ${error.message}`);
}

async function getCurrentUrl(page) {
  return page.url();
}

async function setViewport(page, size = 'desktop') {
  const vp = viewports[size] || viewports.desktop;
  await page.setViewport({ width: vp.width, height: vp.height });
  console.log(`Viewport set to: ${vp.name} (${vp.width}x${vp.height})`);
  return vp;
}

module.exports = {
  config,
  viewports,
  testData,
  uniqueId,
  screenshot,
  screenshotOnFailure,
  getCurrentUrl,
  setViewport,
};