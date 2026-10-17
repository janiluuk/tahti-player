import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as register from '../../../../api/admin/admin-member-register';
import { MemberRegisterPanel } from './MemberRegisterPanel';

describe('MemberRegisterPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists members by name with their status, never their email', async () => {
    vi.spyOn(register, 'fetchMemberRegister').mockResolvedValue({
      ok: true,
      data: register.mockMemberRegister(),
    });
    render(<MemberRegisterPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Member register/ }));
    expect(await screen.findByText('Mart Saar')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Past due')).toBeInTheDocument();
    expect(screen.queryByText(/@example\.com/)).toBeNull();
  });

  it('finds a member by number or name', async () => {
    vi.spyOn(register, 'fetchMemberRegister').mockResolvedValue({
      ok: true,
      data: register.mockMemberRegister(),
    });
    render(<MemberRegisterPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Member register/ }));
    await screen.findByText('Mart Saar');
    fireEvent.change(screen.getByLabelText('Find a member'), {
      target: { value: '12' },
    });
    expect(screen.queryByText('Mart Saar')).toBeNull();
    expect(screen.getByText('Liis Kask')).toBeInTheDocument();
  });
});
