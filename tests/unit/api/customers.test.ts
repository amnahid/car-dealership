import { GET, POST } from '@/app/api/customers/route';
import { NextRequest } from 'next/server';
import Customer from '@/models/Customer';
import { connectDB } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

jest.mock('@/lib/db');
jest.mock('@/models/Customer');
jest.mock('@/lib/apiAuth');
jest.mock('@/lib/activityLogger');
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

const mockCustomer = Customer as jest.Mocked<any>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockGetAuthPayload = getAuthPayload as jest.MockedFunction<typeof getAuthPayload>;
const mockLogActivity = logActivity as jest.MockedFunction<typeof logActivity>;

describe('Customers API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/customers', () => {
    it('returns 401 if unauthorized', async () => {
      mockGetAuthPayload.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/customers');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns 403 if user role is not allowed', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Car Manager', normalizedRoles: ['Car Manager'] } as any);
      const req = new NextRequest('http://localhost/api/customers');
      const res = await GET(req);
      expect(res.status).toBe(403);
    });

    it('returns customers list on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin', normalizedRoles: ['Admin'] } as any);
      mockCustomer.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([{ fullName: 'John Doe' }]),
            }),
          }),
        }),
      } as any);
      mockCustomer.countDocuments.mockResolvedValue(1);

      const req = new NextRequest('http://localhost/api/customers');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.customers).toHaveLength(1);
      expect(data.pagination.total).toBe(1);
    });
  });

  describe('POST /api/customers', () => {
    it('returns 400 if required fields are missing', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin', normalizedRoles: ['Admin'], userId: 'adminid', name: 'Admin' } as any);
      const req = new NextRequest('http://localhost/api/customers', {
        method: 'POST',
        body: JSON.stringify({ fullName: 'John Doe' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('creates a new customer on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin', normalizedRoles: ['Admin'], userId: 'adminid', name: 'Admin' } as any);
      const customerData = {
        fullName: 'John Doe',
        phone: '123456789',
        buildingNumber: '1',
        streetName: 'Main St',
        district: 'Center',
        city: 'Riyadh',
        postalCode: '12345',
      };
      mockCustomer.create.mockResolvedValue({ _id: 'custid', ...customerData });

      const req = new NextRequest('http://localhost/api/customers', {
        method: 'POST',
        body: JSON.stringify(customerData),
      });
      const res = await POST(req);

      expect(res.status).toBe(201);
      expect(mockCustomer.create).toHaveBeenCalled();
      expect(mockLogActivity).toHaveBeenCalled();
    });
  });
});
