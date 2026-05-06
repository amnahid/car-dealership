/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginForm from '@/components/forms/LoginForm';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    if (key === 'email') return 'Email address';
    if (key === 'password') return 'Password';
    if (key === 'signIn') return 'Sign in';
    if (key === 'signingIn') return 'Signing in...';
    return key;
  },
  useLocale: () => 'en',
}));

global.fetch = jest.fn();

describe('LoginForm', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
  });

  it('renders login form correctly', () => {
    render(<LoginForm />);
    
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows error message on failed login', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Invalid credentials' }),
    });

    render(<LoginForm />);
    
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('redirects to dashboard on successful login', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ user: { id: '1', name: 'Admin' } }),
    });

    render(<LoginForm />);
    
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('disables button while loading', async () => {
    let resolveFetch: any;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    (global.fetch as jest.Mock).mockReturnValue(fetchPromise);

    render(<LoginForm />);
    
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled();
    
    resolveFetch({
      ok: true,
      json: jest.fn().mockResolvedValue({ user: { id: '1' } }),
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign in' })).not.toBeDisabled();
    });
  });
});
