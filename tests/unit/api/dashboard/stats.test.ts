import { GET } from '@/app/api/dashboard/stats/route';
import { NextRequest } from 'next/server';
import Car from '@/models/Car';
import VehicleDocument from '@/models/Document';
import ActivityLog from '@/models/ActivityLog';
import CashSale from '@/models/CashSale';
import InstallmentSale from '@/models/InstallmentSale';
import Rental from '@/models/Rental';
import Transaction from '@/models/Transaction';
import { connectDB } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';

jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

jest.mock('@/lib/db');
jest.mock('@/lib/apiAuth');
jest.mock('@/models/Car', () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));
jest.mock('@/models/Document', () => ({
  countDocuments: jest.fn(),
}));
jest.mock('@/models/ActivityLog', () => ({
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      }),
    }),
  }),
}));
jest.mock('@/models/CashSale', () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));
jest.mock('@/models/InstallmentSale', () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));
jest.mock('@/models/Rental', () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));
jest.mock('@/models/Transaction', () => ({
  aggregate: jest.fn(),
}));
jest.mock('@/models/User');

const mockGetAuthPayload = getAuthPayload as jest.MockedFunction<typeof getAuthPayload>;

describe('Dashboard Stats API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 if unauthorized', async () => {
    mockGetAuthPayload.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/dashboard/stats');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 if forbidden role', async () => {
    mockGetAuthPayload.mockResolvedValue({ userId: '123', email: 'test@test.com', normalizedRoles: ['Mechanic'] });
    const req = new NextRequest('http://localhost/api/dashboard/stats');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('fetches quick stats correctly including On Installment and Defaulted statuses', async () => {
    mockGetAuthPayload.mockResolvedValue({ userId: '123', email: 'test@test.com', normalizedRoles: ['Admin'] });
    
    // Quick Path Mocks
    (Car.countDocuments as jest.Mock)
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(2)  // In Stock
      .mockResolvedValueOnce(1)  // Under Repair
      .mockResolvedValueOnce(3)  // Sold
      .mockResolvedValueOnce(1)  // Rented
      .mockResolvedValueOnce(1)  // Reserved
      .mockResolvedValueOnce(1)  // On Installment
      .mockResolvedValueOnce(1); // Defaulted

    (CashSale.countDocuments as jest.Mock).mockResolvedValueOnce(3);
    (InstallmentSale.countDocuments as jest.Mock).mockResolvedValueOnce(2);
    (Rental.countDocuments as jest.Mock).mockResolvedValueOnce(1);
    (VehicleDocument.countDocuments as jest.Mock).mockResolvedValueOnce(0);

    (Transaction.aggregate as jest.Mock)
      .mockResolvedValueOnce([{ total: 1000 }]) // monthlyIncome
      .mockResolvedValueOnce([{ total: 500 }]); // monthlyExpenses

    (InstallmentSale.aggregate as jest.Mock).mockResolvedValueOnce([
      { overdue: [{ count: 1, total: 200 }], upcoming: [{ count: 1, total: 300 }], pending: [{ total: 1500 }] }
    ]);

    const req = new NextRequest('http://localhost/api/dashboard/stats?quick=true');
    const res = await GET(req);
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.carsOnInstallment).toBe(1);
    expect(data.carsDefaulted).toBe(1);
    expect(data.totalCars).toBe(10);
    expect(data.carsInStock).toBe(2);
  });

  it('fetches standard stats correctly including On Installment and Defaulted statuses', async () => {
    mockGetAuthPayload.mockResolvedValue({ userId: '123', email: 'test@test.com', normalizedRoles: ['Admin'] });
    
    // Standard Path Mocks
    (Car.countDocuments as jest.Mock)
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(2)  // In Stock
      .mockResolvedValueOnce(1)  // Under Repair
      .mockResolvedValueOnce(3)  // Sold
      .mockResolvedValueOnce(1)  // Rented
      .mockResolvedValueOnce(1)  // Reserved
      .mockResolvedValueOnce(1)  // On Installment
      .mockResolvedValueOnce(1); // Defaulted

    (Car.aggregate as jest.Mock).mockResolvedValueOnce([{ total: 100 }]); // totalRepairCost
    (CashSale.countDocuments as jest.Mock).mockResolvedValueOnce(3);
    (InstallmentSale.countDocuments as jest.Mock).mockResolvedValueOnce(2);
    (Rental.countDocuments as jest.Mock).mockResolvedValueOnce(1);
    
    (CashSale.aggregate as jest.Mock).mockResolvedValueOnce([{ total: 5000 }]); // cashRevenue
    (InstallmentSale.aggregate as jest.Mock).mockResolvedValueOnce([{ total: 2000 }]); // installmentPaid
    (Rental.aggregate as jest.Mock).mockResolvedValueOnce([{ total: 3000 }]); // rentalRevenue
    
    (Transaction.aggregate as jest.Mock)
      .mockResolvedValueOnce([{ total: 10000 }]) // totalIncome
      .mockResolvedValueOnce([{ total: 4000 }]);  // totalExpenses
      
    (CashSale.aggregate as jest.Mock).mockResolvedValueOnce([]); // salesByMonth
    
    (InstallmentSale.aggregate as jest.Mock).mockResolvedValueOnce([
      { overdue: [], upcoming: [], pending: [] }
    ]);
    
    (VehicleDocument.countDocuments as jest.Mock).mockResolvedValueOnce(0);
    
    (Transaction.aggregate as jest.Mock)
      .mockResolvedValueOnce([{ total: 1000 }]) // monthlyIncome
      .mockResolvedValueOnce([{ total: 500 }]); // monthlyExpenses
      
    (ActivityLog.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });

    (Transaction.aggregate as jest.Mock).mockResolvedValueOnce([]); // expenseByCategory
    (Transaction.aggregate as jest.Mock).mockResolvedValueOnce([]); // monthlyTrends

    const req = new NextRequest('http://localhost/api/dashboard/stats');
    const res = await GET(req);
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.carsOnInstallment).toBe(1);
    expect(data.carsDefaulted).toBe(1);
    expect(data.totalCars).toBe(10);
  });
});
