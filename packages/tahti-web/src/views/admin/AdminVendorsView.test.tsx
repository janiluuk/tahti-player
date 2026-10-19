// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../api/admin';
import { AdminVendorsContent } from './AdminVendorsView';

describe('AdminVendorsContent', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says the live integration status failed to load', async () => {
    const fetch = vi
      .spyOn(admin, 'fetchAdminIntegrationStatus')
      .mockResolvedValue({
        data: [],
        meta: { source: 'api', reason: 'HTTP 502' },
      });
    render(<AdminVendorsContent />);
    expect(
      await screen.findByText('Could not check live integration status'),
    ).toBeTruthy();

    fetch.mockResolvedValue({
      data: [{ name: 'Revelator', live: true, detail: 'Delivering to DSPs' }],
      meta: { source: 'api' },
    } as never);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() =>
      expect(
        screen.queryByText('Could not check live integration status'),
      ).toBeNull(),
    );
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
