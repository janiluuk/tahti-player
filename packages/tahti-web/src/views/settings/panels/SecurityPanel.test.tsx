import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AuthUser } from '../../../api/types';
import { useAuthStore } from '../../../stores/authStore';
import { SecurityPanel } from './SecurityPanel';

vi.mock('../../../components/ChangeEmailForm', () => ({
  ChangeEmailForm: () => null,
}));
vi.mock('../../../components/LinkedLoginsSection', () => ({
  LinkedLoginsSection: () => null,
}));

const user = {
  id: 'u1',
  email: 'liina@gmail.com',
  username: 'liina',
  displayName: 'Liina',
} as AuthUser;

describe('SecurityPanel password section', () => {
  afterEach(cleanup);

  it('offers Set a password when the account has none', () => {
    useAuthStore.setState({ user: { ...user, hasPassword: false } });
    render(<SecurityPanel />);
    expect(
      screen.getByRole('heading', { name: 'Set a password' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Current password')).toBeNull();
  });

  it.each([
    ['has a password', true],
    ['predates hasPassword', undefined],
  ])('shows the change form when the account %s', (_label, hasPassword) => {
    useAuthStore.setState({ user: { ...user, hasPassword } });
    render(<SecurityPanel />);
    expect(screen.getByLabelText('Current password')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Set a password' }),
    ).toBeNull();
  });
});
