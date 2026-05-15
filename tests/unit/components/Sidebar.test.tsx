/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sidebar from '@/components/Sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    // Basic mapping for testing
    const translations: Record<string, string> = {
      'dashboard': 'Dashboard',
      'car': 'Cars',
      'sales': 'Sales',
      'finance': 'Finance',
      'crm': 'CRM',
      'hrm': 'HRM',
      'administration': 'Administration',
      'allCars': 'All Cars',
      'allSales': 'All Sales',
    };
    return translations[key] || key;
  },
  useLocale: () => 'en',
}));

// Mock Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

describe('Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    (useRouter as jest.Mock).mockReturnValue({
        push: jest.fn(),
    });
  });

  it('renders dashboard for any role', () => {
    render(<Sidebar userRoles={['Sales Person']} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders only Sales menus for a Sales Person', () => {
    render(<Sidebar userRoles={['Sales Person']} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('CRM')).toBeInTheDocument();
    
    expect(screen.queryByText('Cars')).not.toBeInTheDocument();
    expect(screen.queryByText('Finance')).not.toBeInTheDocument();
    expect(screen.queryByText('HRM')).not.toBeInTheDocument();
    expect(screen.queryByText('Administration')).not.toBeInTheDocument();
  });

  it('renders only Car menus for a Car Manager', () => {
    render(<Sidebar userRoles={['Car Manager']} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Cars')).toBeInTheDocument();
    
    expect(screen.queryByText('Sales')).not.toBeInTheDocument();
    expect(screen.queryByText('Finance')).not.toBeInTheDocument();
    expect(screen.queryByText('Administration')).not.toBeInTheDocument();
  });

  it('renders both Sales and Car menus for a user with both roles', () => {
    render(<Sidebar userRoles={['Sales Person', 'Car Manager']} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('CRM')).toBeInTheDocument();
    expect(screen.getByText('Cars')).toBeInTheDocument();
    
    expect(screen.queryByText('Finance')).not.toBeInTheDocument();
    expect(screen.queryByText('Administration')).not.toBeInTheDocument();
  });

  it('renders all menus for an Admin', () => {
    render(<Sidebar userRoles={['Admin']} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Cars')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
    expect(screen.getByText('CRM')).toBeInTheDocument();
    expect(screen.getByText('HRM')).toBeInTheDocument();
    expect(screen.getByText('Administration')).toBeInTheDocument();
  });
});
