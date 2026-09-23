/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusBadge from '@/components/StatusBadge';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      handed: 'Handed',
      inStock: 'In Stock',
      sold: 'Sold',
    };
    return map[key] || key;
  },
}));

describe('StatusBadge Component', () => {
  it('renders Handed status with eye-catching styling and checkmark icon', () => {
    const { container } = render(<StatusBadge status="Handed" />);
    expect(screen.getByText('Handed')).toBeInTheDocument();
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders normal status without checkmark', () => {
    const { container } = render(<StatusBadge status="In Stock" />);
    expect(screen.getByText('In Stock')).toBeInTheDocument();
    const svg = container.querySelector('svg');
    expect(svg).not.toBeInTheDocument();
  });
});
