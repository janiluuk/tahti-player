// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as studio from '../api/studio';
import * as extras from '../api/studio-extras';
import { renderWithRouter } from '../test/renderWithRouter';
import { ChannelRadioPlaylistPanel } from './ChannelRadioPlaylistPanel';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('./ChannelRotationEditor', () => ({
  ChannelRotationEditor: () => null,
}));
vi.mock('./ReleaseTracksToRotation', () => ({
  ReleaseTracksToRotation: () => null,
}));

describe('ChannelRadioPlaylistPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('leaves the rotation alone when the chosen playlist fails to load', async () => {
    vi.spyOn(extras, 'fetchProgramme').mockResolvedValue({
      data: {
        fallbackEnabled: true,
        fallbackMode: 'SHUFFLE',
        fallbackAutoEnroll: false,
        announcementsEnabled: false,
        items: [],
      },
      meta: { source: 'api' },
    } as never);
    vi.spyOn(studio, 'fetchStudioCollections').mockResolvedValue({
      data: [{ slug: 'night', name: 'Night Mix', style: 'PLAYLIST' }],
      meta: { source: 'api' },
    } as never);
    vi.spyOn(studio, 'fetchStudioSounds').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    vi.spyOn(studio, 'fetchStudioReleases').mockResolvedValue({
      data: { releases: [] },
      meta: { source: 'api' },
    } as never);
    vi.spyOn(studio, 'fetchStudioCollection').mockResolvedValue({
      data: { slug: 'night', name: 'night', items: [] },
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    const apply = vi.spyOn(extras, 'applyPlaylistToProgramme');

    await renderWithRouter(<ChannelRadioPlaylistPanel />);
    const use = await screen.findByRole('button', { name: 'Use playlist' });
    await act(async () => {
      fireEvent.click(use);
    });
    expect(apply).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      'Could not load that playlist, so the rotation was left unchanged.',
    );
  });
});
