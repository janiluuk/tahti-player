// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ArtistSupportNote } from './ArtistSupportNote';

const tiers = [{ id: 't1', name: 'Supporter', amountCents: 500 }];

describe('ArtistSupportNote', () => {
  afterEach(cleanup);

  it('links the tip jar in a new tab without leaking the opener', () => {
    render(<ArtistSupportNote tiers={[]} tipJarUrl="https://ko-fi.com/aino" />);
    const link = screen.getByRole('link', { name: 'Tip jar' });
    expect(link.getAttribute('href')).toBe('https://ko-fi.com/aino');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it.each(['javascript:alert(1)', 'ftp://example.com/tips', 'not a url', ''])(
    'hides a tip jar that is not an http(s) URL: %s',
    (tipJarUrl) => {
      render(<ArtistSupportNote tiers={tiers} tipJarUrl={tipJarUrl} />);
      expect(screen.queryByRole('link', { name: 'Tip jar' })).toBeNull();
      expect(screen.getByText(/Supporter \(€5\)/)).toBeTruthy();
    },
  );

  it('renders nothing without fan tiers or a tip jar', () => {
    const { container } = render(
      <ArtistSupportNote tiers={[]} tipJarUrl={null} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('keeps the one-line summary when the API sends no description or perks', () => {
    render(
      <ArtistSupportNote
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

  it('lists each tier with its description and humanized perks next to the tip jar', () => {
    render(
      <ArtistSupportNote
        tipJarUrl="https://ko-fi.com/aino"
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
    expect(screen.getByRole('link', { name: 'Tip jar' })).toBeTruthy();
  });
});
