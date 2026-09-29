// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../../api/admin';
import { LegacyMembersPanel } from './LegacyMembersPanel';

async function renderPanel() {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => <LegacyMembersPanel /> }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

describe('LegacyMembersPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists members by name and never uses an email as the name', async () => {
    vi.spyOn(admin, 'fetchLegacyMembers').mockResolvedValue({
      ok: true,
      data: [
        {
          id: 'u1',
          memberNumber: 7,
          displayName: 'Aino Virtanen',
          email: 'aino@example.fi',
          username: 'aino',
          memberSince: '2024-03-01T00:00:00.000Z',
        },
        {
          id: 'u2',
          memberNumber: null,
          displayName: 'veikko@example.fi',
          email: 'veikko@example.fi',
          username: 'veikko',
          memberSince: null,
        },
      ],
    });
    await renderPanel();

    const names = screen.getAllByRole('link').map((link) => link.textContent);
    expect(names).toEqual(['Aino Virtanen', 'veikko']);
    expect(screen.getByText(/#7/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy emails' })).toBeTruthy();
  });

  it('shows an empty state and a load error', async () => {
    const fetchSpy = vi
      .spyOn(admin, 'fetchLegacyMembers')
      .mockResolvedValueOnce({ ok: true, data: [] });
    await renderPanel();
    expect(
      screen.getByText(/Every member is on a Stripe subscription/),
    ).toBeTruthy();
    cleanup();

    fetchSpy.mockResolvedValueOnce({ ok: false, error: '403' });
    await renderPanel();
    expect(screen.getByText("Couldn't load the migration queue")).toBeTruthy();
  });
});
