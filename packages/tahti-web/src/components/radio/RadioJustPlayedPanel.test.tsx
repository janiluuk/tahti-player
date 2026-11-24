// @vitest-environment jsdom
import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MediaArtworkDefaultProvider } from '@tahti-player/ui';

import { placeholderArtworkUrl } from '../../lib/placeholderArt';
import { renderWithRouter } from '../../test/renderWithRouter';
import { RadioJustPlayedPanel } from './RadioJustPlayedPanel';

describe('RadioJustPlayedPanel', () => {
  afterEach(cleanup);

  it('shows the default artwork, not initials, for a track without a cover', async () => {
    await renderWithRouter(
      <MediaArtworkDefaultProvider value={(seed) => `/artwork/${seed}.webp`}>
        <RadioJustPlayedPanel
          items={[
            {
              id: 'play-1',
              title: 'Night drive',
              artistName: 'Kaiku',
              artistUsername: 'kaiku',
              artworkUrl: null,
              playedAt: '2026-11-09T10:00:00.000Z',
              soundId: 'snd1',
            },
          ]}
          onRetry={() => {}}
          handlers={{
            currentId: null,
            playerStatus: 'idle',
            queueIds: new Set(),
            onPlay: () => {},
            onTogglePause: () => {},
            onQueue: () => {},
            onTrackInfo: () => {},
          }}
        />
      </MediaArtworkDefaultProvider>,
    );
    expect(screen.getByRole('img', { name: 'Night drive' })).toHaveAttribute(
      'src',
      placeholderArtworkUrl('snd1'),
    );
    expect(
      screen.getByRole('button', { name: 'Play Night drive' }),
    ).toBeDisabled();
  });

  it('highlights the playing track and pauses it from its artwork', async () => {
    const onTogglePause = vi.fn();
    const onTrackInfo = vi.fn();
    await renderWithRouter(
      <RadioJustPlayedPanel
        items={[
          {
            id: 'play-1',
            title: 'Night drive',
            artistName: 'Kaiku',
            artistUsername: 'kaiku',
            artworkUrl: null,
            playedAt: '2026-11-09T10:00:00.000Z',
            soundId: 'snd1',
            audioUrl: 'https://example.test/track.mp3',
          },
        ]}
        onRetry={() => {}}
        handlers={{
          currentId: 'sound:snd1',
          playerStatus: 'playing',
          queueIds: new Set(),
          onPlay: vi.fn(),
          onTogglePause,
          onQueue: vi.fn(),
          onTrackInfo,
        }}
      />,
    );
    const row = screen.getByTestId('track-row');
    expect(row).toHaveAttribute('aria-current', 'true');
    await userEvent.click(
      within(row).getByRole('button', { name: 'Pause Night drive' }),
    );
    expect(onTogglePause).toHaveBeenCalledOnce();
    await userEvent.click(
      within(row).getByRole('button', { name: 'Night drive' }),
    );
    expect(onTrackInfo).toHaveBeenCalledOnce();
  });
});
