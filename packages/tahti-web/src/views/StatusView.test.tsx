// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import { renderWithRouter } from '../test/renderWithRouter';
import { StatusView } from './StatusView';

vi.stubGlobal('__APP_VERSION__', '0.0.0');
vi.stubGlobal('__RELEASE_TAG_DATE__', '2026-10-19T00:00:00Z');
vi.stubGlobal('__BUILD_TIME__', '2026-10-19T00:00:00Z');

describe('StatusView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('offers to check again when the API reported no checks', async () => {
    const fetch = vi.spyOn(client, 'fetchPlatformStatus').mockResolvedValue({
      data: { status: 'down', checks: {}, ts: '2026-10-19T00:00:00Z' },
      meta: { source: 'api' },
    });
    await renderWithRouter(<StatusView />);
    expect(await screen.findByText('No health checks reported')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
    fetch.mockResolvedValue({
      data: {
        status: 'ok',
        checks: { postgres: { state: 'ok', critical: true, latencyMs: 2 } },
      },
      meta: { source: 'api' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('postgres *')).toBeTruthy();
  });

  it('links back to the Help center', async () => {
    vi.spyOn(client, 'fetchPlatformStatus').mockResolvedValue({
      data: { status: 'ok', checks: {}, ts: '2026-10-19T00:00:00Z' },
      meta: { source: 'api' },
    });
    await renderWithRouter(<StatusView />, { paths: ['/help'] });
    fireEvent.click(screen.getByRole('link', { name: 'Help center' }));
    expect(await screen.findByTestId('routed-to')).toHaveTextContent('/help');
  });
});
