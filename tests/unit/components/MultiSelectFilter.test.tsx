/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MultiSelectFilter from '@/components/MultiSelectFilter';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      allStatuses: 'All Statuses',
      selectAll: 'Select All',
      clearAll: 'Clear All',
      selected: 'selected',
    };
    return translations[key] || key;
  },
  useLocale: () => 'en',
}));

describe('MultiSelectFilter Component', () => {
  const options = [
    { value: 'Active', label: 'Active Status' },
    { value: 'Completed', label: 'Completed Status' },
    { value: 'Handed', label: 'Handed Status' },
    { value: 'Defaulted', label: 'Defaulted Status' },
  ];

  it('renders with placeholder when no items are selected', () => {
    render(
      <MultiSelectFilter
        placeholder="Filter by Status"
        options={options}
        selectedValues={[]}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('Filter by Status')).toBeInTheDocument();
  });

  it('displays single item label when one item is selected', () => {
    render(
      <MultiSelectFilter
        options={options}
        selectedValues={['Active']}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('Active Status')).toBeInTheDocument();
  });

  it('displays count when multiple items are selected', () => {
    render(
      <MultiSelectFilter
        options={options}
        selectedValues={['Active', 'Handed']}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  it('opens dropdown and toggles options on click', () => {
    const handleChange = jest.fn();
    render(
      <MultiSelectFilter
        options={options}
        selectedValues={['Active']}
        onChange={handleChange}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Select All')).toBeInTheDocument();
    expect(screen.getByText('Clear All')).toBeInTheDocument();

    // Check second item
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(4);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();

    fireEvent.click(checkboxes[1]);
    expect(handleChange).toHaveBeenCalledWith(['Active', 'Completed']);
  });

  it('handles Select All and Clear All actions', () => {
    const handleChange = jest.fn();
    render(
      <MultiSelectFilter
        options={options}
        selectedValues={['Active']}
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    // Select All
    fireEvent.click(screen.getByText('Select All'));
    expect(handleChange).toHaveBeenCalledWith(['Active', 'Completed', 'Handed', 'Defaulted']);

    // Clear All
    fireEvent.click(screen.getByText('Clear All'));
    expect(handleChange).toHaveBeenCalledWith([]);
  });
});
