/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SalaryPaymentsPage from '@/app/dashboard/salary-payments/page';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children }: { children: React.ReactNode }) => {
    return children;
  };
});

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

global.fetch = jest.fn();

describe('SalaryPaymentsPage', () => {
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
      
      if (urlString.includes('/api/salary-payments')) {
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            payments: [{ _id: '1', paymentId: 'SAL-0001', employeeName: 'John Staff', amount: 3000, paymentDate: new Date().toISOString(), status: 'Active', month: 5, year: 2024 }],
            pagination: { pages: 1, total: 1 },
            totalThisMonth: 3000,
            totalShown: 3000,
          }),
        });
      }
      
      if (urlString.includes('/api/employees')) {
          return Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({ employees: [] }) });
      }
      
      return Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({}) });
    });
  });

  it('renders salary payments correctly', async () => {
    render(<SalaryPaymentsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('SAL-0001')).toBeInTheDocument();
      expect(screen.getByText('John Staff')).toBeInTheDocument();
    });
  });

  it('opens add payment modal on button click', async () => {
    render(<SalaryPaymentsPage />);
    
    const addButton = await screen.findByText(/addNew/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('addPayment')).toBeInTheDocument();
    });
  });
});
