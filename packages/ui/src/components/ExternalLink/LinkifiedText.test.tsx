import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LinkifiedText, splitLinks } from './LinkifiedText';

describe('LinkifiedText', () => {
  it('splits text around http and https URLs, leaving trailing punctuation out', () => {
    expect(
      splitLinks(
        'Read https://tahti.live/news/1. More at http://a.b/c?d=1, ok',
      ),
    ).toEqual([
      { kind: 'text', value: 'Read ' },
      { kind: 'link', value: 'https://tahti.live/news/1' },
      { kind: 'text', value: '. More at ' },
      { kind: 'link', value: 'http://a.b/c?d=1' },
      { kind: 'text', value: ', ok' },
    ]);
    expect(splitLinks('no links here')).toEqual([
      { kind: 'text', value: 'no links here' },
    ]);
  });

  it('renders each URL as a link that opens in a new tab', () => {
    render(<LinkifiedText text="See https://tahti.live for more" />);
    const link = screen.getByRole('link', { name: /https:\/\/tahti\.live/ });
    expect(link.getAttribute('href')).toBe('https://tahti.live');
    expect(link.getAttribute('target')).toBe('_blank');
  });
});
