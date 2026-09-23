import { NextRequest } from 'next/server';
import InstallmentSale from '@/models/InstallmentSale';
import Car from '@/models/Car';
import { connectDB } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));
jest.mock('@/lib/db');
jest.mock('@/models/InstallmentSale', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));
jest.mock('@/models/Car', () => ({
  __esModule: true,
  default: {
    findByIdAndUpdate: jest.fn(),
  },
}));
jest.mock('@/lib/apiAuth');
jest.mock('@/lib/activityLogger');

import { POST } from '@/app/api/sales/installments/[id]/revert-handover/route';

const mockInstallmentSale = InstallmentSale as jest.Mocked<any>;
const mockCar = Car as jest.Mocked<any>;
const mockGetAuthPayload = getAuthPayload as jest.MockedFunction<typeof getAuthPayload>;
const mockLogActivity = logActivity as jest.MockedFunction<typeof logActivity>;

describe('Installment Sale Revert Handover API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthPayload.mockResolvedValue({
      userId: 'user-1',
      email: 'admin@example.com',
      role: 'Admin',
      roles: ['Admin'],
      normalizedRole: 'Admin',
      normalizedRoles: ['Admin'],
      name: 'Admin User',
      passwordVersion: 1,
    });
  });

  it('returns 401 if not authenticated', async () => {
    mockGetAuthPayload.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/sales/installments/sale-1/revert-handover', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'sale-1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 404 if sale not found', async () => {
    mockInstallmentSale.findById.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/sales/installments/sale-1/revert-handover', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'sale-1' }) });
    expect(res.status).toBe(404);
  });

  it('successfully reverts Handed status to Active and On Installment for active schedule', async () => {
    mockInstallmentSale.findById.mockResolvedValue({
      _id: 'sale-1',
      saleId: 'SAL-001',
      car: 'car-1',
      customerName: 'Ahmed Ali',
      isDeleted: false,
      remainingAmount: 5000,
      paymentSchedule: [
        { installmentNumber: 1, dueDate: new Date('2028-01-01'), amount: 1000, status: 'Pending' }
      ]
    });

    mockCar.findByIdAndUpdate.mockResolvedValue({
      _id: 'car-1',
      brand: 'Toyota',
      model: 'Camry',
      plateNumber: 'ABC-1234',
      status: 'On Installment',
    });

    const req = new NextRequest('http://localhost/api/sales/installments/sale-1/revert-handover', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'sale-1' }) });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.saleStatus).toBe('Active');
    expect(data.carStatus).toBe('On Installment');
    expect(mockInstallmentSale.findByIdAndUpdate).toHaveBeenCalledWith('sale-1', { status: 'Active' }, { new: true });
    expect(mockCar.findByIdAndUpdate).toHaveBeenCalledWith('car-1', { status: 'On Installment' }, { new: true });
    expect(mockLogActivity).toHaveBeenCalled();
  });
});
