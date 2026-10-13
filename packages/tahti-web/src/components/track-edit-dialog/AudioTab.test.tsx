// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { StudioSound } from '../../api/studio-types';
import { renderWithRouter } from '../../test/renderWithRouter';
import { AudioTab } from './AudioTab';
import type { TrackEditDialogState } from './useTrackEditDialog';

vi.mock('../AudioRevisionList', () => ({ AudioRevisionList: () => null }));
vi.mock('./StationIdClipForm', () => ({ StationIdClipForm: () => null }));
vi.mock('../tahti/WaveformSeekbar', () => ({ WaveformSeekbar: () => null }));

const ITEM: StudioSound = { id: 's1', title: 'Night Drive', status: 'READY' };

function stateFor(masteringEnabled: boolean): TrackEditDialogState {
  return {
    masteringEnabled,
    form: {},
    editList: null,
    peaks: [],
    quickBusy: null,
    revisionTick: 0,
    playBusy: false,
    isCurrentPlayable: false,
    isPlaying: false,
    currentTime: 0,
    playerDuration: 0,
    startPlayback: vi.fn(),
    setPlayerStatus: vi.fn(),
    onNormalize: vi.fn(),
    onAutoTrim: vi.fn(),
  } as unknown as TrackEditDialogState;
}

function renderTab(masteringEnabled: boolean) {
  return renderWithRouter(
    <AudioTab soundId="s1" item={ITEM} state={stateFor(masteringEnabled)} />,
    { paths: ['/studio/sounds/$id/editor', '/studio/mastering/$id'] },
  );
}

describe('AudioTab', () => {
  afterEach(cleanup);

  it('opens the full audio editor from its tooltip-wrapped link', async () => {
    const { router } = await renderTab(false);
    const link = screen.getByRole('link', { name: 'Open full audio editor' });
    expect(link.getAttribute('href')).toBe('/studio/sounds/s1/editor');
    expect(link.querySelector('button')).toBeNull();
    expect(
      screen.queryByRole('link', { name: 'Match to a reference track' }),
    ).toBeNull();
    fireEvent.click(link);
    await screen.findByTestId('routed-to');
    expect(router.state.location.pathname).toBe('/studio/sounds/s1/editor');
  });

  it('opens mastering from its tooltip-wrapped link when enabled', async () => {
    const { router } = await renderTab(true);
    const link = screen.getByRole('link', {
      name: 'Match to a reference track',
    });
    expect(link.querySelector('button')).toBeNull();
    fireEvent.click(link);
    await screen.findByTestId('routed-to');
    expect(router.state.location.pathname).toBe('/studio/mastering/s1');
  });
});
