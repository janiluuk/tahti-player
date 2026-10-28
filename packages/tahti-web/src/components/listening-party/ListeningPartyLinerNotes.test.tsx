import { cleanup, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { renderWithRouter } from '../../test/renderWithRouter';
import { testParty } from './__fixtures__/party';
import { ListeningPartyLinerNotes } from './ListeningPartyLinerNotes';

describe('ListeningPartyLinerNotes', () => {
  afterEach(cleanup);

  it('shows the commentary, release and track credits and notices', async () => {
    await renderWithRouter(<ListeningPartyLinerNotes party={testParty()} />);
    expect(screen.getByText(/Made in a cabin\./)).toBeTruthy();
    const release = screen.getByRole('list', { name: 'Release credits' });
    expect(
      within(release).getByRole('link', { name: 'Aino Virta' }),
    ).toHaveAttribute('href', '/u/aino');
    expect(within(release).getByText('Kaiku Mastering')).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: '2. Aurora Drift' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('list', { name: 'Credits for Aurora Drift' }),
    ).toHaveTextContent('vocals Liina');
    expect(screen.getByText('℗ 2026 Aino Virta · Polar Records')).toBeTruthy();
  });

  it('drops credits whose name is an email address', async () => {
    const party = testParty();
    party.release.credits = [
      { role: 'mixing', name: 'mix@example.com', artistUsername: null },
      { role: 'mastering', name: 'eve@example.com', artistUsername: 'eve' },
    ];
    await renderWithRouter(<ListeningPartyLinerNotes party={party} />);
    expect(screen.queryByText(/@example\.com/)).toBeNull();
    expect(screen.getByRole('link', { name: 'eve' })).toBeTruthy();
  });

  it('renders nothing without notes, credits or notices', async () => {
    const party = testParty({ tracks: [] });
    party.release = {
      ...party.release,
      commentary: null,
      credits: [],
      pLine: null,
      cLine: null,
      labelImprint: null,
    };
    await renderWithRouter(<ListeningPartyLinerNotes party={party} />);
    expect(screen.queryByRole('region', { name: 'Liner notes' })).toBeNull();
  });
});
