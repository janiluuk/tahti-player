// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../api/admin';
import * as client from '../../api/client';
import { renderWithRouter } from '../../test/renderWithRouter';
import { AdminRadioView } from './AdminRadioView';

vi.mock('../../components/AdminGate', () => ({
  AdminGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../components/AdminNav', () => ({
  AdminPageLayout: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
vi.mock('../../components/MulticastSection', () => ({
  MulticastSection: () => null,
}));
vi.mock('../../components/TahtiRotationPlaylistEditor', () => ({
  TahtiRotationPlaylistEditor: () => null,
}));

const EMPTY = {
  nowPlaying: { live: false, slug: null, artistName: null },
  eligible: [],
  history: [],
  optedOut: [],
};

describe('AdminRadioView', () => {
  beforeEach(() => {
    vi.spyOn(admin, 'fetchAdminRadioRotation').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    } as never);
    vi.spyOn(client, 'fetchRadioStation').mockResolvedValue({
      data: { hlsUrl: null, nowPlaying: null },
      playable: null,
      meta: { source: 'api' },
    } as never);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says the radio admin failed to load instead of listing no channels', async () => {
    const fetch = vi.spyOn(admin, 'fetchAdminRadio').mockResolvedValue({
      data: EMPTY,
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderWithRouter(<AdminRadioView />);
    expect(await screen.findByText('Could not load Tahti Radio')).toBeTruthy();
    expect(screen.queryByText(/Eligible channels/)).toBeNull();

    fetch.mockResolvedValue({ data: EMPTY, meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByRole('tablist');
    expect(screen.queryByText('Could not load Tahti Radio')).toBeNull();
  });
});
