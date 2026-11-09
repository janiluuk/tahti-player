// @vitest-environment jsdom
import { cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MediaArtworkDefaultProvider } from '@tahti-player/ui';

import { renderWithRouter } from '../test/renderWithRouter';
import { ReleaseTracklistDialog } from './ReleaseTracklistDialog';
import { TrackInfoDialog } from './TrackInfoDialog';

const withDefaults = (ui: React.ReactNode) => (
  <MediaArtworkDefaultProvider value={(seed) => `/artwork/${seed}.webp`}>
    {ui}
  </MediaArtworkDefaultProvider>
);

describe('track and release dialogs without a cover', () => {
  afterEach(cleanup);

  it('TrackInfoDialog shows the seeded default artwork, not initials', async () => {
    await renderWithRouter(
      withDefaults(
        <TrackInfoDialog
          isOpen
          onClose={() => {}}
          track={{
            title: 'Aurora',
            artistName: 'Northern Lights',
            artistUsername: null,
            artworkUrl: null,
          }}
        />,
      ),
    );
    expect(
      document.querySelector('img[src="/artwork/Aurora.webp"]'),
    ).toBeTruthy();
    expect(document.body.textContent).not.toContain('AU');
  });

  it('ReleaseTracklistDialog shows the seeded default artwork, not initials', async () => {
    await renderWithRouter(
      withDefaults(
        <ReleaseTracklistDialog
          isOpen
          onClose={() => {}}
          artistName="Northern Lights"
          channelSlug="northern-lights"
          release={{ id: 'release-1', title: 'Polar Nights', tracks: [] }}
        />,
      ),
    );
    expect(
      document.querySelector('img[src="/artwork/release-1.webp"]'),
    ).toBeTruthy();
    expect(document.body.textContent).not.toContain('PO');
  });
});
