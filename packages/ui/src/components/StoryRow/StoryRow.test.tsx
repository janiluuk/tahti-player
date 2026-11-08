// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { buttonVariants } from '../Button/Button';
import { StoryRow } from './StoryRow';

describe('StoryRow', () => {
  afterEach(cleanup);

  it('wraps each child in a snapping slot under the title', () => {
    render(
      <StoryRow title="Community stories" actions={<span>extra</span>}>
        <p>one</p>
        <p>two</p>
      </StoryRow>,
    );
    expect(
      screen.getByRole('heading', { name: 'Community stories' }),
    ).toBeTruthy();
    expect(screen.getByText('extra')).toBeTruthy();
    const slots = screen.getByTestId('story-row-track').children;
    expect(slots).toHaveLength(2);
    expect(slots[0]?.className).toContain('snap-start');
  });

  it('disables Previous at the start', () => {
    render(
      <StoryRow title="Stories">
        <p>one</p>
      </StoryRow>,
    );
    expect(
      (screen.getByRole('button', { name: /^Previous/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('uses the same square scroll buttons as CardsRow', () => {
    render(
      <StoryRow title="Stories">
        <p>one</p>
      </StoryRow>,
    );
    const expected = buttonVariants({ variant: 'noShadow', size: 'icon' });
    for (const name of [/^Previous/, /^Next/]) {
      const button = screen.getByRole('button', { name });
      expect(button.className).toContain(expected);
      expect(button.className).not.toContain('rounded-full');
    }
  });
});
