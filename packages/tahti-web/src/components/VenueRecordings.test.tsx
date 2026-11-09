// @vitest-environment jsdom
import { cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MediaArtworkDefaultProvider } from '@tahti-player/ui';

import { renderWithRouter } from '../test/renderWithRouter';
import { VenueRecordings } from './VenueRecordings';

describe('VenueRecordings', () => {
  afterEach(cleanup);

  it('shows the seeded default artwork, not initials, for a track without a cover', async () => {
    const { container } = await renderWithRouter(
      <MediaArtworkDefaultProvider value={(seed) => `/artwork/${seed}.webp`}>
        <VenueRecordings
          recordings={[
            {
              id: 'track-1',
              title: 'Harbour Lights',
              artistName: 'Northern Lights',
              coverUrl: null,
              channelSlug: 'northern-lights',
              durationSec: 240,
              releasedAt: '2026-10-01T00:00:00Z',
            },
          ]}
        />
      </MediaArtworkDefaultProvider>,
    );
    expect(
      container.querySelector('img[src="/artwork/track-1.webp"]'),
    ).toBeTruthy();
    expect(container.textContent).not.toContain('HA');
  });
});
