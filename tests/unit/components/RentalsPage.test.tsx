/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RentalsPage from '@/app/dashboard/sales/rentals/page';
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
jest.mock('@/components/ImageUpload', () => ({
  PdfUpload: () => <div data-testid="pdf-upload" />
}));

global.fetch = jest.fn();

describe('RentalsPage', () => {
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
      
      if (urlString.includes('/api/sales/rentals')) {
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            rentals: [{ _id: '1', rentalId: 'RNT-0001', customerName: 'John Doe', totalAmount: 500, startDate: new Date().toISOString(), endDate: new Date().toISOString(), status: 'Active' }],
            pagination: { pages: 1, total: 1 },
            totalRevenue: 500,
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

  it('renders rentals list correctly', async () => {
    render(<RentalsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('RNT-0001')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('opens add rental modal on button click', async () => {
    render(<RentalsPage />);
    
    const addButton = await screen.findByText(/addNew/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('newRental')).toBeInTheDocument();
    });
  });
});
