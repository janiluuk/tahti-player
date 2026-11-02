// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SoundAudience } from './SoundAudience';

const PEOPLE = [
  {
    id: 'u1',
    name: 'Liina',
    username: 'liina',
    avatarUrl: null,
    href: '/u/liina',
  },
  {
    id: 'u2',
    name: 'Kaamos Crew',
    username: 'kaamos',
    avatarUrl: 'https://example.com/k.png',
  },
];

describe('SoundAudience', () => {
  afterEach(cleanup);

  it('lists the collections first, each with a thumbnail and link', () => {
    render(
      <SoundAudience
        collections={[
          {
            id: 'c1',
            name: 'Night drives',
            meta: 'by Liina · 24 tracks',
            href: '/c/night',
          },
        ]}
        likers={PEOPLE}
        reposters={[]}
        listeners={PEOPLE}
      />,
    );
    const tabs = screen.getAllByRole('tab').map((tab) => tab.textContent);
    expect(tabs).toEqual(['Collections1', 'Liked2', 'Reposted0', 'Played by2']);
    const row = screen.getByTestId('sound-audience-collection');
    expect(row.textContent).toContain('Night drives');
    expect(row.closest('a')?.getAttribute('href')).toBe('/c/night');
  });

  it('shows people with avatars or their initial', () => {
    render(
      <SoundAudience
        collections={[]}
        likers={PEOPLE}
        reposters={[]}
        listeners={[]}
        defaultTab="likes"
      />,
    );
    const rows = screen.getAllByTestId('sound-audience-person');
    expect(rows).toHaveLength(2);
    expect(rows[0]!.textContent).toContain('L');
    expect(rows[0]!.textContent).toContain('@liina');
  });

  it('says so when a tab is empty, and uses totals for the counts', () => {
    render(
      <SoundAudience
        collections={[]}
        likers={PEOPLE}
        reposters={[]}
        listeners={[]}
        counts={{ likes: 40 }}
        renderMore={(tab) => <button type="button">More {tab}</button>}
        defaultTab="likes"
      />,
    );
    expect(screen.getByRole('tab', { name: /Liked/ }).textContent).toContain(
      '40',
    );
    expect(screen.getByRole('button', { name: 'More likes' })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /Reposted/ }));
    expect(screen.getByText('Nobody has reposted this yet.')).toBeTruthy();
  });
});
