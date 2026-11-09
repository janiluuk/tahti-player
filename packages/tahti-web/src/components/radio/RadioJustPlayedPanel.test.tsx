// @vitest-environment jsdom
import { cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MediaArtworkDefaultProvider } from '@tahti-player/ui';

import { renderWithRouter } from '../../test/renderWithRouter';
import { RadioJustPlayedPanel } from './RadioJustPlayedPanel';

describe('RadioJustPlayedPanel', () => {
  afterEach(cleanup);

  it('shows the default artwork, not initials, for a track without a cover', async () => {
    const { container } = await renderWithRouter(
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
    expect(
      container.querySelector('img[src="/artwork/snd1.webp"]'),
    ).toBeTruthy();
    expect(container.textContent).not.toContain('NI');
  });
});
