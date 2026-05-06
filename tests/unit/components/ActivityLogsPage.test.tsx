/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActivityLogsPage from '@/app/dashboard/activity-logs/page';

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
jest.mock('@/components/DateRangeFilter', () => ({
  __esModule: true,
  DateRangeFilter: () => <div data-testid="date-range-filter" />
}));

global.fetch = jest.fn();

describe('ActivityLogsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url) => {
      const urlString = typeof url === 'string' ? url : url.url;
      
      if (urlString.includes('/api/activity-logs')) {
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            logs: [{ _id: '1', action: 'Create Car', module: 'Cars', userName: 'Admin', ipAddress: '127.0.0.1', createdAt: new Date().toISOString() }],
            pagination: { pages: 1, total: 1 },
          }),
        });
      }
      
      return Promise.resolve({ ok: true, json: jest.fn().mockResolvedValue({}) });
    });
  });

  it('renders logs list correctly', async () => {
    render(<ActivityLogsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Create Car')).toBeInTheDocument();
      expect(screen.getByText('Cars')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });
});
