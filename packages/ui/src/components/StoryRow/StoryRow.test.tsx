// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

  it('hides the arrows when every story fits', () => {
    render(
      <StoryRow title="Stories">
        <p>one</p>
      </StoryRow>,
    );
    expect(screen.queryByRole('button', { name: /^Previous/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Next/ })).toBeNull();
  });

  it('shows neutral arrows when stories overflow, Previous disabled at the start', () => {
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(2000);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(800);
    render(
      <StoryRow title="Stories">
        <p>one</p>
      </StoryRow>,
    );
    const previous = screen.getByRole('button', {
      name: /^Previous/,
    }) as HTMLButtonElement;
    const next = screen.getByRole('button', {
      name: /^Next/,
    }) as HTMLButtonElement;
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(false);
    const expected = buttonVariants({ variant: 'secondary', size: 'icon-sm' });
    expect(next.className).toContain(expected);
    vi.restoreAllMocks();
  });
});
