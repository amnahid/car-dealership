/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmployeesPage from '@/app/dashboard/employees/page';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children }: { children: React.ReactNode }) => {
    return children;
  };
});

jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: any) => value,
}));

jest.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    return key;
  },
  useLocale: () => 'en',
}));

jest.mock('@/components/SearchableSelect', () => ({
  __esModule: true,
  default: () => <div data-testid="searchable-select" />
}));
jest.mock('@/components/DataTransferButtons', () => ({
  __esModule: true,
  default: () => <div data-testid="data-transfer-buttons" />
}));
jest.mock('@/components/ImageUpload', () => ({
  __esModule: true,
  default: () => <div data-testid="image-upload" />
}));

global.fetch = jest.fn();

describe('EmployeesPage', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    (global.fetch as jest.Mock).mockImplementation((url) => {
      const urlString = typeof url === 'string' ? url : url.url;
      
      if (urlString.includes('/api/employees')) {
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            employees: [{ _id: '1', employeeId: 'EMP-0001', name: 'John Staff', designation: 'Staff', department: 'Sales', baseSalary: 3000, isActive: true }],
            pagination: { pages: 1, total: 1 },
            totalMonthlySalary: 3000,
          }),
        });
      }
      
      return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({ employees: [] })
      });
    });
  });

  it('renders employees list correctly', async () => {
    render(<EmployeesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('EMP-0001')).toBeInTheDocument();
      expect(screen.getByText('John Staff')).toBeInTheDocument();
    });
  });

  it('opens add employee modal on button click', async () => {
    render(<EmployeesPage />);
    
    const addButton = await screen.findByText(/addNew/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('addEmployee')).toBeInTheDocument();
    });
  });
});
