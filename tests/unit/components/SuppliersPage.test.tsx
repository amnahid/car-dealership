/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SuppliersPage from '@/app/dashboard/cars/suppliers/page';
import { useRouter, useSearchParams } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
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

jest.mock('@/components/DataTransferButtons', () => ({
  __esModule: true,
  default: () => <div data-testid="data-transfer-buttons" />
}));

global.fetch = jest.fn();

describe('SuppliersPage', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    });
    (global.fetch as jest.Mock).mockImplementation((url) => {
      const urlString = typeof url === 'string' ? url : url.url;
      
      if (urlString.includes('/api/suppliers')) {
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            suppliers: [{ _id: '1', companyName: 'Test Supplier', supplierId: 'SUP-001', companyNumber: '123', phone: '123456', totalPurchases: 1, totalAmount: 1000, status: 'active' }],
            pagination: { totalPages: 1, total: 1, page: 1, limit: 10 },
          }),
        });
      }
      
      return Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({}) });
    });
  });

  it('renders suppliers list correctly', async () => {
    render(<SuppliersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Supplier')).toBeInTheDocument();
      expect(screen.getByText('123')).toBeInTheDocument();
    });
  });
});
