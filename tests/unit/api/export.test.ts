import { NextRequest } from 'next/server';
import Car from '@/models/Car';
import InstallmentSale from '@/models/InstallmentSale';
import { connectDB } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';

jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));
jest.mock('@/lib/db');
jest.mock('@/models/Car', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));
jest.mock('@/models/Customer', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('@/models/Employee', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('@/models/Supplier', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('@/models/Repair', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('@/models/CashSale', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('@/models/InstallmentSale', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('@/models/Rental', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('@/models/Transaction', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('@/models/SalaryPayment', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('@/models/User', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('@/models/ActivityLog', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('@/lib/apiAuth');

import { GET } from '@/app/api/export/route';

const mockCar = Car as jest.Mocked<any>;
const mockInstallmentSale = InstallmentSale as jest.Mocked<any>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockGetAuthPayload = getAuthPayload as jest.MockedFunction<typeof getAuthPayload>;

describe('Export API - Filter-Aware CSV Export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthPayload.mockResolvedValue({ id: 'u1', name: 'Admin', normalizedRoles: ['Admin'] } as any);
  });

  it('returns 401 if unauthorized', async () => {
    mockGetAuthPayload.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/export?type=cars');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 if type parameter missing', async () => {
    const req = new NextRequest('http://localhost/api/export');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('filters cars export by status and brand correctly', async () => {
    const leanMock = jest.fn().mockResolvedValue([
      { carId: 'CAR-1', brand: 'Toyota', model: 'Camry', year: 2024, status: 'In Stock' }
    ]);
    const sortMock = jest.fn().mockReturnValue({ lean: leanMock });
    mockCar.find.mockReturnValue({ sort: sortMock });

    const req = new NextRequest('http://localhost/api/export?type=cars&status=In%20Stock&brand=Toyota');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockCar.find).toHaveBeenCalledWith(expect.objectContaining({
      isDeleted: { $ne: true },
      status: 'In Stock',
      brand: { $regex: 'Toyota', $options: 'i' }
    }));

    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // Verifies UTF-8 BOM (0xEF, 0xBB, 0xBF)
    expect(bytes[0]).toBe(0xef);
    expect(bytes[1]).toBe(0xbb);
    expect(bytes[2]).toBe(0xbf);

    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(buffer);
    expect(text).toContain('CAR-1');
    expect(text).toContain('Toyota');
  });

  it('filters installment sales by status and date range', async () => {
    const leanMock = jest.fn().mockResolvedValue([
      { saleId: 'SAL-100', customerName: 'Ali', status: 'Active', totalPrice: 60000 }
    ]);
    const sortMock = jest.fn().mockReturnValue({ lean: leanMock });
    mockInstallmentSale.find.mockReturnValue({ sort: sortMock });

    const req = new NextRequest('http://localhost/api/export?type=installmentSales&status=Active&startDate=2026-01-01');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockInstallmentSale.find).toHaveBeenCalledWith(expect.objectContaining({
      isDeleted: { $ne: true },
      status: 'Active',
      startDate: expect.any(Object),
    }));

    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    expect(bytes[0]).toBe(0xef);
    expect(bytes[1]).toBe(0xbb);
    expect(bytes[2]).toBe(0xbf);

    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(buffer);
    expect(text).toContain('SAL-100');
    expect(text).toContain('Ali');
  });
});
