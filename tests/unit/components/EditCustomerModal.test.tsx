/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditCustomerModal from '@/components/EditCustomerModal';

jest.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    return key;
  },
  useLocale: () => 'en',
}));

jest.mock('@/components/ImageUpload', () => ({
  ImageUpload: () => <div data-testid="image-upload" />,
  DocumentUpload: () => <div data-testid="document-upload" />,
}));

describe('EditCustomerModal', () => {
  const mockCustomer = {
    _id: 'custid',
    customerId: 'CUS-0001',
    fullName: 'John Doe',
    phone: '123456789',
    email: 'john@example.com',
    buildingNumber: '1',
    streetName: 'Main St',
    district: 'Center',
    city: 'Riyadh',
    postalCode: '12345',
    countryCode: 'SA',
  };

  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with customer data', () => {
    render(<EditCustomerModal customer={mockCustomer as any} onClose={mockOnClose} onSave={mockOnSave} />);
    
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123456789')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
  });

  it('calls onSave with updated data when form is submitted', async () => {
    render(<EditCustomerModal customer={mockCustomer as any} onClose={mockOnClose} onSave={mockOnSave} />);
    
    fireEvent.change(screen.getByDisplayValue('John Doe'), { target: { value: 'John Smith' } });
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        fullName: 'John Smith',
      }));
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<EditCustomerModal customer={mockCustomer as any} onClose={mockOnClose} onSave={mockOnSave} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
