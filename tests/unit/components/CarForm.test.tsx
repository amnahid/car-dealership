/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CarForm from '@/components/forms/CarForm';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    return key;
  },
  useLocale: () => 'en',
}));

jest.mock('@/components/SearchableSelect', () => () => <div data-testid="searchable-select" />);
jest.mock('@/components/StatusBadge', () => () => <div data-testid="status-badge" />);
jest.mock('@/components/ImageUpload', () => ({
  MultiImageUpload: () => <div data-testid="multi-image-upload" />,
}));

global.fetch = jest.fn();

describe('CarForm', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
      back: jest.fn(),
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ suppliers: [] }),
    });
  });

  it('renders correctly in create mode', async () => {
    render(<CarForm mode="create" />);
    
    expect(screen.getByText('purchaseInfo')).toBeInTheDocument();
    expect(screen.getByText('brand *')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'addCar' })).toBeInTheDocument();
  });

  it('populates data in edit mode', async () => {
    const initialData = {
      brand: 'Toyota',
      model: 'Corolla',
      year: '2022',
      chassisNumber: 'CH123',
    };
    render(<CarForm mode="edit" initialData={initialData as any} />);
    
    expect(screen.getByDisplayValue('Toyota')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Corolla')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'updateCar' })).toBeInTheDocument();
  });

  it('submits correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ suppliers: [] }),
    }).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ car: { _id: '1' } }),
    });

    const { container } = render(<CarForm mode="create" />);
    
    fireEvent.change(container.querySelector('input[name="brand"]')!, { target: { value: 'Honda' } });
    fireEvent.change(container.querySelector('input[name="model"]')!, { target: { value: 'Civic' } });
    fireEvent.change(container.querySelector('input[name="year"]')!, { target: { value: '2024' } });
    fireEvent.change(container.querySelector('input[name="chassisNumber"]')!, { target: { value: 'CH456' } });
    fireEvent.change(container.querySelector('input[name="purchase.purchasePrice"]')!, { target: { value: '60000' } });
    fireEvent.change(container.querySelector('input[name="purchase.purchaseDate"]')!, { target: { value: '2024-05-01' } });

    fireEvent.click(screen.getByRole('button', { name: 'addCar' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/cars');
    });
  });

  it('shows error message on failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ suppliers: [] }),
    }).mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Failed to save' }),
    });

    const { container } = render(<CarForm mode="create" />);
    
    fireEvent.change(container.querySelector('input[name="brand"]')!, { target: { value: 'Honda' } });
    fireEvent.change(container.querySelector('input[name="model"]')!, { target: { value: 'Civic' } });
    fireEvent.change(container.querySelector('input[name="year"]')!, { target: { value: '2024' } });
    fireEvent.change(container.querySelector('input[name="chassisNumber"]')!, { target: { value: 'CH456' } });
    fireEvent.change(container.querySelector('input[name="purchase.purchasePrice"]')!, { target: { value: '60000' } });
    fireEvent.change(container.querySelector('input[name="purchase.purchaseDate"]')!, { target: { value: '2024-05-01' } });

    fireEvent.click(screen.getByRole('button', { name: 'addCar' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to save')).toBeInTheDocument();
    });
  });
});
