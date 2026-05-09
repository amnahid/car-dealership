import { GET, POST } from '@/app/api/employees/route';
import { NextRequest } from 'next/server';
import Employee from '@/models/Employee';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

jest.mock('@/lib/db');
jest.mock('@/models/Employee', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn().mockResolvedValue([]),
  },
}));
jest.mock('@/lib/apiAuth');
jest.mock('@/lib/activityLogger');
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

const mockEmployee = Employee as jest.Mocked<any>;
const mockGetAuthPayload = getAuthPayload as jest.MockedFunction<typeof getAuthPayload>;
const mockLogActivity = logActivity as jest.MockedFunction<typeof logActivity>;

describe('Employees API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/employees', () => {
    it('returns employees list on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin', normalizedRoles: ['Admin'] } as any);
      mockEmployee.countDocuments.mockResolvedValue(1);
      mockEmployee.aggregate.mockResolvedValue([]);
      
      const mockResult = [{ name: 'John Doe' }];
      const queryMock: any = {};
      queryMock.sort = jest.fn().mockReturnValue(queryMock);
      queryMock.skip = jest.fn().mockReturnValue(queryMock);
      queryMock.limit = jest.fn().mockReturnValue(queryMock);
      queryMock.lean = jest.fn().mockResolvedValue(mockResult);
      
      mockEmployee.find.mockReturnValue(queryMock);

      const req = new NextRequest('http://localhost/api/employees');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.employees).toHaveLength(1);
    });
  });

  describe('POST /api/employees', () => {
    it('creates an employee on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin', normalizedRoles: ['Admin'], userId: 'adminid', name: 'Admin' } as any);
      const employeeData = { name: 'John Doe', phone: '123456', designation: 'Staff', department: 'Sales', baseSalary: 3000, joiningDate: '2024-01-01' };
      mockEmployee.create.mockResolvedValue({ _id: 'empid', ...employeeData });

      const req = new NextRequest('http://localhost/api/employees', {
        method: 'POST',
        body: JSON.stringify(employeeData),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      expect(mockLogActivity).toHaveBeenCalled();
    });
  });
});
