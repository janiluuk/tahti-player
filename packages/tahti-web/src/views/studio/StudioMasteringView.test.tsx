// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as studio from '../../api/studio';
import type { EditorSource } from '../../api/studio-types';
import { useAuthStore } from '../../stores/authStore';
import { renderWithRouter } from '../../test/renderWithRouter';
import { StudioMasteringView } from './StudioMasteringView';

type SourceResult = Awaited<ReturnType<typeof studio.fetchEditorSource>>;

function source(title: string): SourceResult {
  return {
    data: { url: `https://cdn.example/${title}.mp3`, durationSec: 60, title },
    meta: { source: 'api' },
  };
}

function pickReference(container: HTMLElement) {
  const input = container.querySelector('input[type="file"]');
  if (!input) {
    throw new Error('no file input');
  }
  fireEvent.change(input, {
    target: { files: [new File(['x'], 'ref.wav', { type: 'audio/wav' })] },
  });
}

describe('StudioMasteringView', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        email: 'artist@tahti.live',
        username: 'artist',
        displayName: 'An Artist',
        role: 'ARTIST',
        isBoard: false,
        isMember: true,
        channel: { slug: 'artist', state: 'OFFLINE' },
      },
      hydrated: true,
      loading: false,
      profileLoaded: true,
    });
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
  });

  it('shows the saved track at once and waits for the fresh source before matching', async () => {
    const fetch = vi
      .spyOn(studio, 'fetchEditorSource')
      .mockResolvedValue(source('First mix'));
    const first = await renderWithRouter(<StudioMasteringView soundId="s1" />);
    expect(await screen.findByText('First mix')).toBeTruthy();
    first.unmount();

    let resolve: (value: SourceResult) => void = () => undefined;
    fetch.mockReturnValue(new Promise((r) => (resolve = r)));
    const { container } = await renderWithRouter(
      <StudioMasteringView soundId="s1" />,
    );
    expect(screen.getByText('First mix')).toBeTruthy();
    expect(screen.queryByText('Loading track…')).toBeNull();
    pickReference(container);
    const match = screen.getByRole('button', { name: 'Match to reference' });
    expect(match).toBeDisabled();

    await act(async () => resolve(source('Second mix')));
    expect(screen.getByText('Second mix')).toBeTruthy();
    expect(match).toBeEnabled();
  });

  it('shows the error when the refresh fails instead of the saved source', async () => {
    const fetch = vi
      .spyOn(studio, 'fetchEditorSource')
      .mockResolvedValue(source('First mix'));
    const first = await renderWithRouter(<StudioMasteringView soundId="s1" />);
    expect(await screen.findByText('First mix')).toBeTruthy();
    first.unmount();

    fetch.mockResolvedValue({
      data: {} as EditorSource,
      meta: { source: 'api', reason: 'HTTP 404' },
    });
    await renderWithRouter(<StudioMasteringView soundId="s1" />);
    expect(await screen.findByText('Could not load this track')).toBeTruthy();
    expect(screen.getByText('HTTP 404')).toBeTruthy();
  });
});
