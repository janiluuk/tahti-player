// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as exportApi from '../../api/hearthis-export';
import * as integrations from '../../api/integrations';
import { HearthisExportSection } from './HearthisExportSection';

async function renderSection(
  installed: boolean,
  initialStatus: exportApi.HearthisExportStatus | null = null,
) {
  vi.spyOn(integrations, 'fetchMeIntegrations').mockResolvedValue({
    data: [
      {
        slug: 'hearthis-export',
        name: 'hearthis.at export',
        description: '',
        scope: 'EXPORT',
        authKind: 'API_KEY',
        installed,
        connected: false,
      },
    ],
    source: 'api',
  });
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => (
        <HearthisExportSection soundId="s1" initialStatus={initialStatus} />
      ),
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

describe('HearthisExportSection', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('pushes the track and shows it was queued', async () => {
    await renderSection(true);
    const spy = vi
      .spyOn(exportApi, 'exportSoundToHearthis')
      .mockResolvedValue({ ok: true, status: 'pending' });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Push' }));
    });
    expect(spy).toHaveBeenCalledWith('s1');
    expect(screen.getByTestId('hearthis-export-status').textContent).toContain(
      'Queued',
    );
    expect(
      (screen.getByRole('button', { name: 'Push' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('offers a retry after a failed export and shows the error', async () => {
    await renderSection(true, 'failed');
    vi.spyOn(exportApi, 'exportSoundToHearthis').mockResolvedValue({
      ok: false,
      error: 'This track has no audio file to export',
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    });
    expect(
      screen.getByText('This track has no audio file to export'),
    ).toBeTruthy();
  });

  it('points to the plugin when it is not installed', async () => {
    await renderSection(false);
    expect(screen.queryByRole('button')).toBeNull();
    expect(
      screen.getByRole('link', { name: 'Settings → Integrations' }),
    ).toBeTruthy();
  });
});
