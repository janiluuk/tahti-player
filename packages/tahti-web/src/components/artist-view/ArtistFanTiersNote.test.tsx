// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ArtistFanTiersNote } from './ArtistProfileSections';

describe('ArtistFanTiersNote', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing without tiers', () => {
    const { container } = render(<ArtistFanTiersNote tiers={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('keeps the one-line summary when the API sends no description or perks', () => {
    render(
      <ArtistFanTiersNote
        tiers={[
          { id: 't1', name: 'Supporter', amountCents: 500 },
          { id: 't2', name: 'Patron', amountCents: 1500 },
        ]}
      />,
    );
    expect(
      screen.getByText('Fan tiers: Supporter (€5), Patron (€15)'),
    ).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Fan tiers' })).toBeNull();
  });

  it('lists each tier with its description and humanized perks', () => {
    render(
      <ArtistFanTiersNote
        tiers={[
          {
            id: 't1',
            name: 'Supporter',
            amountCents: 500,
            description: 'Keeps the stream running.',
            perks: ['FAN_CHAT', 'Signed postcard'],
          },
          {
            id: 't2',
            name: 'Patron',
            amountCents: 1500,
            description: null,
            perks: [],
          },
        ]}
      />,
    );
    expect(screen.getByRole('region', { name: 'Fan tiers' })).toBeTruthy();
    expect(screen.getByText('Keeps the stream running.')).toBeTruthy();
    const perks = screen.getByRole('list', { name: 'Supporter perks' });
    expect(
      within(perks)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Fan chat', 'Signed postcard']);
    expect(screen.getByText('Patron')).toBeTruthy();
    expect(screen.queryByRole('list', { name: 'Patron perks' })).toBeNull();
  });
});
