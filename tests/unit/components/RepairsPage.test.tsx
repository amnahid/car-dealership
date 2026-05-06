/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RepairsPage from '@/app/dashboard/repairs/page';
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

jest.mock('@/components/DataTransferButtons', () => ({
  __esModule: true,
  default: () => <div data-testid="data-transfer-buttons" />
}));

global.fetch = jest.fn();

describe('RepairsPage', () => {
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
      
      if (urlString.includes('/api/repairs')) {
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            repairs: [{ _id: '1', carId: 'CAR-001', repairDescription: 'Oil Change', totalCost: 100, repairDate: new Date().toISOString(), status: 'Pending' }],
            pagination: { pages: 1, total: 1 },
          }),
        });
      }
      
      return Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({}) });
    });
  });

  it('renders repairs list correctly', async () => {
    render(<RepairsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Oil Change')).toBeInTheDocument();
      expect(screen.getByText('CAR-001')).toBeInTheDocument();
    });
  });
});
