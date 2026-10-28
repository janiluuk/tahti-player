import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { testClock, testParty } from './__fixtures__/party';
import { ListeningPartyTracklist } from './ListeningPartyTracklist';

describe('ListeningPartyTracklist', () => {
  afterEach(cleanup);

  it('lists every track with its length before the start', () => {
    const party = testParty();
    render(
      <ListeningPartyTracklist
        tracks={party.tracks}
        clock={testClock(party, -10)}
      />,
    );
    const rows = screen.getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([
      '1Cold Open2:00',
      '2Aurora Drift3:00',
      '3Thaw1:00',
    ]);
    expect(screen.queryByText('Now playing')).toBeNull();
  });

  it('highlights the playing track with its elapsed time', () => {
    const party = testParty({ state: 'LIVE' });
    render(
      <ListeningPartyTracklist
        tracks={party.tracks}
        clock={testClock(party, 185)}
      />,
    );
    const current = screen
      .getAllByRole('listitem')
      .find((row) => row.getAttribute('aria-current') === 'true');
    expect(current).toBeTruthy();
    expect(within(current!).getByText('Aurora Drift')).toBeTruthy();
    expect(within(current!).getByText('Now playing')).toBeTruthy();
    expect(within(current!).getByText('1:05 / 3:00')).toBeTruthy();
  });
});
