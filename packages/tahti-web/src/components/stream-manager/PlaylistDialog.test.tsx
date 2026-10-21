// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PlaylistDialog } from './PlaylistDialog';
import type { StreamManagerState } from './useStreamManagerState';

function stateWith(overrides: Partial<StreamManagerState>) {
  return {
    playlistDialogOpen: true,
    setPlaylistDialogOpen: vi.fn(),
    collections: [{ slug: 'night', name: 'Night Mix', items: [] }],
    selectedCollectionSlug: 'night',
    previewCollection: vi.fn(async () => undefined),
    playlistLoading: false,
    selectedCollection: null,
    previewError: null,
    selectedPlaylistHasRotationTracks: false,
    rotationBusy: false,
    pendingApply: null,
    setPendingApply: vi.fn(),
    handleApplyCollectionToRotation: vi.fn(),
    ...overrides,
  } as unknown as StreamManagerState;
}

describe('PlaylistDialog', () => {
  afterEach(cleanup);

  it('says the preview failed to load instead of "no tracks"', () => {
    const state = stateWith({ previewError: 'HTTP 502' });
    render(<PlaylistDialog state={state} />);
    expect(screen.getByText('Could not load this playlist')).toBeTruthy();
    expect(screen.queryByText('This playlist has no tracks.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(state.previewCollection).toHaveBeenCalledWith('night');
  });
});
