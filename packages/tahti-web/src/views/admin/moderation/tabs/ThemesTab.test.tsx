// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../../../api/admin';
import { ThemesTab } from './ThemesTab';

const THEME: admin.AdminTheme = {
  id: 't1',
  name: 'Revontulet',
  vars: {
    '--background': '#0b1d26',
    '--radius': '4px',
    '--primary': '#3ddc97',
  },
  dark: {},
  visibility: 'PENDING_REVIEW',
  moderationNote: null,
  prStatus: 'NONE',
  prUrl: null,
  createdAt: '2026-09-20T10:00:00.000Z',
  updatedAt: '2026-09-20T10:00:00.000Z',
  authorUsername: 'aurora',
};

describe('theme moderation helpers', () => {
  it('approves only pending themes without a registry PR in flight', () => {
    expect(admin.canApproveTheme(THEME)).toBe(true);
    expect(admin.canApproveTheme({ ...THEME, prStatus: 'ERROR' })).toBe(true);
    expect(admin.canApproveTheme({ ...THEME, prStatus: 'PENDING' })).toBe(
      false,
    );
    expect(admin.canApproveTheme({ ...THEME, visibility: 'REJECTED' })).toBe(
      false,
    );
  });

  it('takes swatches from colour values only', () => {
    expect(admin.themeSwatches(THEME)).toEqual(['#0b1d26', '#3ddc97']);
  });
});

describe('ThemesTab', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists pending themes and approves one', async () => {
    const fetchThemes = vi
      .spyOn(admin, 'fetchAdminThemes')
      .mockResolvedValue({ ok: true, themes: [THEME] });
    const approve = vi
      .spyOn(admin, 'approveAdminTheme')
      .mockResolvedValue({ ok: true });

    await act(async () => {
      render(<ThemesTab />);
    });
    expect(fetchThemes).toHaveBeenCalledWith('PENDING_REVIEW');
    expect(screen.getByText('Revontulet')).toBeTruthy();
    expect(screen.getByText(/@aurora/)).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    });
    expect(approve).toHaveBeenCalledWith('t1');
    expect(fetchThemes).toHaveBeenCalledTimes(2);
  });

  it('asks for a note before rejecting', async () => {
    vi.spyOn(admin, 'fetchAdminThemes').mockResolvedValue({
      ok: true,
      themes: [THEME],
    });
    const reject = vi
      .spyOn(admin, 'rejectAdminTheme')
      .mockResolvedValue({ ok: true });

    await act(async () => {
      render(<ThemesTab />);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    const confirm = screen.getByRole('button', { name: 'Reject theme' });
    expect(confirm.hasAttribute('disabled')).toBe(true);

    fireEvent.change(screen.getByLabelText('Note to the author'), {
      target: { value: 'Text contrast is too low.' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Reject theme' }));
    });
    expect(reject).toHaveBeenCalledWith('t1', 'Text contrast is too low.');
  });

  it('refuses an empty rejection note without calling the API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await expect(admin.rejectAdminTheme('t1', '  ')).resolves.toMatchObject({
      ok: false,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
