// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
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
});
