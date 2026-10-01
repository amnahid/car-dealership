jest.mock('@/lib/db');
jest.mock('@/models/InstallmentSale', () => ({
  __esModule: true,
  default: {
    aggregate: jest.fn(),
  },
}));
jest.mock('@/lib/apiAuth');
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

import { GET } from '@/app/api/reports/installment-collections/route';
import { NextRequest } from 'next/server';
import InstallmentSale from '@/models/InstallmentSale';
import { getAuthPayload } from '@/lib/apiAuth';

const mockInstallmentSale = InstallmentSale as jest.Mocked<any>;
const mockGetAuthPayload = getAuthPayload as jest.MockedFunction<typeof getAuthPayload>;

describe('Installment Collections Report API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthPayload.mockResolvedValue({
      userId: 'user-1',
      name: 'Admin User',
      email: 'admin@test.com',
      role: 'admin',
      roles: ['admin'],
      normalizedRole: 'admin',
      normalizedRoles: ['admin'],
    } as any);
  });

  it('should return 401 if not authorized', async () => {
    mockGetAuthPayload.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/reports/installment-collections');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('should filter strictly by dueDate in the selected month', async () => {
    mockInstallmentSale.aggregate.mockResolvedValue([
      {
        saleId: 'INS-0001',
        customerName: 'John Doe',
        customerPhone: '0501234567',
        carId: 'CAR-001',
        paymentSchedule: {
          installmentNumber: 1,
          dueDate: new Date('2026-09-05T00:00:00.000Z'),
          amount: 2000,
          status: 'Paid',
          method: 'Bank Transfer',
          paidAmount: 2000,
          paidDate: new Date('2026-09-02T00:00:00.000Z'),
          voucherNumber: 'V-001',
        },
        carDetails: { plateNumber: 'ABC 1234' },
      },
      {
        saleId: 'INS-0002',
        customerName: 'Jane Smith',
        customerPhone: '0509876543',
        carId: 'CAR-002',
        paymentSchedule: {
          installmentNumber: 3,
          dueDate: new Date('2026-09-15T00:00:00.000Z'),
          amount: 1500,
          status: 'Overdue',
          paidAmount: 0,
        },
        carDetails: { plateNumber: 'XYZ 5678' },
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/reports/installment-collections?month=2026-09');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data).toHaveLength(2);
    expect(data[0].saleId).toBe('INS-0001');
    expect(data[0].bankAmount).toBe(2000);
    expect(data[0].cashAmount).toBe(0);
    expect(data[0].carId).toBe('ABC 1234');

    expect(data[1].saleId).toBe('INS-0002');
    expect(data[1].bankAmount).toBe(0);
    expect(data[1].cashAmount).toBe(0);
    expect(data[1].status).toBe('Overdue');

    const aggregatePipeline = mockInstallmentSale.aggregate.mock.calls[0][0];
    const matchStage = aggregatePipeline.find((stage: any) => stage.$match && stage.$match['paymentSchedule.dueDate']);
    expect(matchStage).toBeDefined();
    expect(matchStage.$match['paymentSchedule.dueDate'].$gte).toEqual(new Date(Date.UTC(2026, 8, 1)));
    expect(matchStage.$match['paymentSchedule.dueDate'].$lte).toEqual(new Date(Date.UTC(2026, 8 + 1, 0, 23, 59, 59, 999)));
  });
});
