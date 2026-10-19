// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../api/admin';
import { AdminUserEditPanel } from './AdminUserEditPanel';

describe('AdminUserEditPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('offers Retry when the account fails to load', async () => {
    const fetch = vi.spyOn(admin, 'fetchAdminUser').mockResolvedValue({
      data: null,
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    render(<AdminUserEditPanel userId="u1" />);
    expect(await screen.findByText('Could not load this account')).toBeTruthy();
    expect(screen.getByText('HTTP 502')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
