import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmbedSurface } from './EmbedSurface';

describe('EmbedSurface', () => {
  it('keeps the player-bar widget short in compact mode', () => {
    const { container } = render(
      <EmbedSurface
        provider="hearthis"
        embedUri="14599989"
        title="Night set"
        autoplay={false}
        compact
      />,
    );
    const frame = container.querySelector('iframe')!;
    expect(frame.getAttribute('height')).toBe('96');
    expect(frame.getAttribute('src')).toContain('style=1');
  });

  it('uses the provider height and full style outside compact mode', () => {
    const { container } = render(
      <EmbedSurface
        provider="hearthis"
        embedUri="14599989"
        title="Night set"
        autoplay={false}
      />,
    );
    const frame = container.querySelector('iframe')!;
    expect(frame.getAttribute('height')).toBe('150');
    expect(frame.getAttribute('src')).toContain('style=2');
  });
});
