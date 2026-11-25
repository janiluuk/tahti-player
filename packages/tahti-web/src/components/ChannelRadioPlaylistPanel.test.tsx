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
  ChannelRotationEditor: ({
    onAddGroup,
  }: {
    onAddGroup?: (group: { id: string; label: string; items: [] }) => void;
  }) =>
    onAddGroup ? (
      <button
        type="button"
        onClick={() => onAddGroup({ id: 'g1', label: 'Night Mix', items: [] })}
      >
        Add group
      </button>
    ) : null,
}));
vi.mock('./ReleaseTracksToRotation', () => ({
  ReleaseTracksToRotation: () => null,
}));

describe('ChannelRadioPlaylistPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('paints Overwrite rotation red next to the secondary Append', async () => {
    mockPanelData();
    await renderWithRouter(<ChannelRadioPlaylistPanel />);
    fireEvent.click(
      await screen.findByRole('tab', { name: /Active rotation/ }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Add group' }));
    expect(
      screen.getByRole('button', { name: 'Overwrite rotation' }).className,
    ).toContain('bg-accent-red');
    expect(
      screen.getByRole('button', { name: 'Append tracks' }).className,
    ).toContain('bg-secondary');
  });

  it('leaves the rotation alone when the chosen playlist fails to load', async () => {
    mockPanelData();
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

  it('disables Manage clips while clips between programs are off', async () => {
    mockPanelData();
    await renderWithRouter(<ChannelRadioPlaylistPanel />);
    expect(
      await screen.findByRole('link', { name: 'Manage clips' }),
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('disables Use playlist when the selected playlist is the active rotation', async () => {
    mockPanelData({
      rotation: [
        { id: 'sound-1', isFallback: true, fallbackOrder: 0 },
        { id: 'sound-2', isFallback: true, fallbackOrder: 1 },
      ],
      playlistItems: [
        { id: 'item-1', position: 0, soundId: 'sound-1' },
        { id: 'item-2', position: 1, soundId: 'sound-2' },
      ],
    });

    await renderWithRouter(<ChannelRadioPlaylistPanel />);
    expect(
      await screen.findByRole('button', { name: 'Use playlist' }),
    ).toBeDisabled();
  });
});

function mockPanelData({
  rotation = [],
  playlistItems = [],
}: {
  rotation?: Array<Record<string, unknown>>;
  playlistItems?: Array<Record<string, unknown>>;
} = {}) {
  vi.spyOn(extras, 'fetchProgramme').mockResolvedValue({
    data: {
      fallbackEnabled: true,
      fallbackMode: 'SHUFFLE',
      fallbackAutoEnroll: false,
      announcementsEnabled: false,
      items: rotation,
    },
    meta: { source: 'api' },
  } as never);
  vi.spyOn(studio, 'fetchStudioCollections').mockResolvedValue({
    data: [
      {
        slug: 'night',
        name: 'Night Mix',
        style: 'PLAYLIST',
        items: playlistItems,
      },
    ],
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
}
