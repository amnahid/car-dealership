/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CashSalesPage from '@/app/dashboard/sales/cash/page';
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
jest.mock('@/components/DateRangeFilter', () => ({
  __esModule: true,
  DateRangeFilter: () => <div data-testid="date-range-filter" />
}));

global.fetch = jest.fn();

describe('CashSalesPage', () => {
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
      
      if (urlString.includes('/api/sales/cash')) {
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            sales: [{ _id: '1', saleId: 'CSH-0001', customerName: 'John Doe', finalPrice: 10000, saleDate: new Date().toISOString() }],
            pagination: { pages: 1, total: 1 },
            totalRevenue: 10000,
          }),
        });
      }
      
      return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({ 
              cars: [], 
              customers: [], 
              employees: [],
              pagination: { pages: 1, total: 0 }
          })
      });
    });
  });

  it('renders sales list correctly', async () => {
    render(<CashSalesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('CSH-0001')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('opens add sale modal on button click', async () => {
    render(<CashSalesPage />);
    
    const addButton = await screen.findByText(/addNew/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('newSale')).toBeInTheDocument();
    });
  });
});
