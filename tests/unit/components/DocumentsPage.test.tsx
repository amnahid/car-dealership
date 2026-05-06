/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DocumentsPage from '@/app/dashboard/documents/page';
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

global.fetch = jest.fn();

describe('DocumentsPage', () => {
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
      
      if (urlString.includes('/api/documents')) {
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            documents: [{ _id: '1', carId: 'CAR-001', documentType: 'Insurance', expiryDate: new Date(Date.now() + 86400000).toISOString() }],
            pagination: { pages: 1, total: 1 },
          }),
        });
      }
      
      return Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({}) });
    });
  });

  it('renders documents list correctly', async () => {
    render(<DocumentsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Insurance')).toBeInTheDocument();
      expect(screen.getByText('CAR-001')).toBeInTheDocument();
    });
  });
});
