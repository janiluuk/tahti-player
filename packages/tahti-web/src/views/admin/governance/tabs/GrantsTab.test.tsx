// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as governance from '../../../../api/admin/admin-governance';
import { GrantsTab } from './GrantsTab';

async function renderGrantsTab() {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => <GrantsTab /> }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

describe('GrantsTab', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows Retry instead of "No grant cycles" when the load fails', async () => {
    const fetch = vi.spyOn(governance, 'fetchAdminGrants').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderGrantsTab();

    expect(screen.getByText('Could not load grant cycles')).toBeTruthy();
    expect(screen.queryByText('No grant cycles have been run yet.')).toBeNull();
    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } });
    await act(async () => {
      screen.getByRole('button', { name: 'Retry' }).click();
    });
    expect(screen.getByText('No grant cycles have been run yet.')).toBeTruthy();
  });

  it('keeps the loaded years and flags the ones that failed', async () => {
    vi.spyOn(governance, 'fetchAdminGrants').mockResolvedValue({
      data: [{ year: 2025, grantCount: 3, totalCents: 120000 }],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderGrantsTab();

    expect(screen.getByText('3 recipients')).toBeTruthy();
    expect(screen.getByText('Some years could not be loaded')).toBeTruthy();
  });
});
