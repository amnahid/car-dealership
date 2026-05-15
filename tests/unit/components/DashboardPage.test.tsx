/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '@/app/dashboard/page';
import { useTranslations, useLocale } from 'next-intl';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'totalCars': 'Total Cars',
      'inStock': 'In Stock',
      'underRepair': 'Under Repair',
      'sold': 'Sold',
      'rented': 'Rented',
      'onInstallment': 'On Installment',
      'reserved': 'Reserved',
      'defaulted': 'Defaulted',
      'inventoryStatus': 'Inventory Status',
      'loading': 'Loading dashboard...',
    };
    return translations[key] || key;
  },
  useLocale: () => 'en',
}));

// Mock chart components
jest.mock('@/components/charts', () => ({
  BarChartComponent: () => <div data-testid="bar-chart" />,
  LineChartComponent: () => <div data-testid="line-chart" />,
  AreaChartComponent: () => <div data-testid="area-chart" />,
  PieChartComponent: () => <div data-testid="pie-chart" />,
  DateRangeFilter: ({ onChange }: any) => <div data-testid="date-range-filter" />,
}));

// Mock fetch
global.fetch = jest.fn();

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all 7 inventory status cards after loading data', async () => {
    const mockStats = {
      totalCars: 10,
      carsInStock: 2,
      carsUnderRepair: 1,
      carsSold: 3,
      carsRented: 1,
      carsReserved: 1,
      carsOnInstallment: 1,
      carsDefaulted: 1,
      expiringDocuments: 0,
      recentActivity: [],
      totalRevenue: 0,
      totalProfit: 0,
      totalExpenses: 0,
      monthlyRevenue: 0,
      monthlyProfit: 0,
      monthlyExpenses: 0,
      cashRevenue: 0,
      installmentPaid: 0,
      rentalRevenue: 0,
      pendingInstallments: 0,
      overdueInstallments: 0,
      overdueInstallmentsAmount: 0,
      upcomingInstallments: 0,
      upcomingInstallmentsAmount: 0,
      salesByMonth: [],
      incomeByType: [],
      expenseByCategory: [],
      monthlyTrends: [],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockStats,
    });

    render(<DashboardPage />);

    // Check for loading state first
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
    });

    // Verify all status cards are present
    expect(screen.getByText('Total Cars')).toBeInTheDocument();
    expect(screen.getByText('In Stock')).toBeInTheDocument();
    expect(screen.getByText('Under Repair')).toBeInTheDocument();
    expect(screen.getByText('Sold')).toBeInTheDocument();
    expect(screen.getByText('Rented')).toBeInTheDocument();
    expect(screen.getByText('On Installment')).toBeInTheDocument();
    expect(screen.getByText('Reserved')).toBeInTheDocument();
    expect(screen.getByText('Defaulted')).toBeInTheDocument();
    
    // Check specific values for new cards
    expect(screen.getAllByText('1')).toHaveLength(5); // Rented, Reserved, On Installment, Defaulted, Under Repair all have 1
  });
});
