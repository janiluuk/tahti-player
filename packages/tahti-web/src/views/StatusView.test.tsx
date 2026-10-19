// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
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
    render(<StatusView />);
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
});
