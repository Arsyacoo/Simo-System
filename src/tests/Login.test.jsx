import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Login from '../pages/Login';
import * as AppDataCore from '../context/AppDataCore';

describe('Login Component DOM Tests', () => {
  const mockLogin = vi.fn();

  vi.spyOn(AppDataCore, 'useAppData').mockReturnValue({
    login: mockLogin,
  });

  it('renders login form elements and demo accounts', () => {
    render(<Login />);

    // Check header
    expect(screen.getByText('Masuk ke Sistem')).toBeInTheDocument();

    // Check inputs
    expect(screen.getByLabelText('Alamat Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();

    // Check demo accounts
    expect(screen.getByText('Rina Wijaya')).toBeInTheDocument();
    expect(screen.getByText('Joko Anwar')).toBeInTheDocument();
    expect(screen.getByText('Dewi Lestari')).toBeInTheDocument();
  });

  it('fills credentials when a demo account is clicked', () => {
    render(<Login />);

    const emailInput = screen.getByLabelText('Alamat Email');
    expect(emailInput.value).toBe('');

    // Click "Joko Anwar" foreman account
    const jokoButton = screen.getByText('Joko Anwar').closest('button');
    fireEvent.click(jokoButton);

    // Verify input value changed
    expect(emailInput.value).toBe('joko.anwar@simo.test');
  });

  it('submits form with correct parameters', async () => {
    mockLogin.mockClear();
    render(<Login />);

    // Choose demo user
    const jokoButton = screen.getByText('Joko Anwar').closest('button');
    fireEvent.click(jokoButton);

    // Click submit button
    const submitButton = screen.getByRole('button', { name: /Masuk Aplikasi/i });
    fireEvent.click(submitButton);

    // Verify login was called with correct arguments
    expect(mockLogin).toHaveBeenCalledWith('joko.anwar@simo.test', 'password');
  });
});
