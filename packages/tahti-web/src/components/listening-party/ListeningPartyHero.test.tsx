import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { renderWithRouter } from '../../test/renderWithRouter';
import { testClock, testParty } from './__fixtures__/party';
import { ListeningPartyHero } from './ListeningPartyHero';

describe('ListeningPartyHero', () => {
  afterEach(cleanup);

  it('counts down to the start with the title, host and running time', async () => {
    const party = testParty();
    await renderWithRouter(
      <ListeningPartyHero party={party} clock={testClock(party, -3661)} />,
    );
    expect(screen.getByRole('heading', { name: 'Polar Static' })).toBeTruthy();
    expect(screen.getByRole('timer').textContent).toBe('Starts in01:01:01');
    expect(screen.getByRole('link', { name: 'Aino Virta' })).toHaveAttribute(
      'href',
      '/u/aino',
    );
    expect(screen.getByRole('link', { name: 'Night Drive' })).toHaveAttribute(
      'href',
      '/channel/night-drive',
    );
    expect(screen.getByText(/3 tracks · 6 min/)).toBeTruthy();
    expect(screen.getByText('Headphones on.')).toBeTruthy();
  });

  it('names the playing track once live', async () => {
    const party = testParty({ state: 'LIVE' });
    await renderWithRouter(
      <ListeningPartyHero party={party} clock={testClock(party, 130)} />,
    );
    expect(screen.getByText('Live now')).toBeTruthy();
    expect(screen.getByText('2/3')).toBeTruthy();
    expect(screen.getByText(/Aurora Drift/)).toBeTruthy();
  });

  it('links to the release after the party', async () => {
    const party = testParty({ state: 'ENDED' });
    await renderWithRouter(
      <ListeningPartyHero party={party} clock={testClock(party, 9999)} />,
    );
    expect(screen.getByText(/has ended/)).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Open the release' }),
    ).toHaveAttribute('href', '/r/polar-static');
  });

  it('says a canceled party is canceled and hides the host note', async () => {
    const party = testParty({ state: 'CANCELED' });
    await renderWithRouter(
      <ListeningPartyHero party={party} clock={testClock(party, -60)} />,
    );
    expect(screen.getByText(/canceled this listening party/)).toBeTruthy();
    expect(screen.queryByRole('timer')).toBeNull();
    expect(screen.queryByText('Headphones on.')).toBeNull();
  });

  it('never shows an email as the host name', async () => {
    const party = testParty({
      host: {
        username: 'aino',
        displayName: 'aino@example.com',
        avatarUrl: null,
      },
    });
    await renderWithRouter(
      <ListeningPartyHero party={party} clock={testClock(party, -60)} />,
    );
    expect(screen.queryByText(/@example\.com/)).toBeNull();
    expect(screen.getByRole('link', { name: 'aino' })).toBeTruthy();
  });
});
