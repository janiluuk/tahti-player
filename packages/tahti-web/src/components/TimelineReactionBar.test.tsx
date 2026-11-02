import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TimelineReactionBar } from './TimelineReactionBar';

function renderBar(
  overrides: Partial<Parameters<typeof TimelineReactionBar>[0]> = {},
) {
  const props = {
    clock: '1:05',
    commentsEnabled: true,
    signedIn: true,
    busy: false,
    commentOpen: false,
    onReact: vi.fn(),
    onComment: vi.fn(),
    onSignIn: vi.fn(),
    ...overrides,
  };
  render(<TimelineReactionBar {...props} />);
  return props;
}

describe('TimelineReactionBar', () => {
  afterEach(cleanup);

  it('opens the emoji set from one React button and closes it after a reaction', () => {
    const props = renderBar();
    expect(screen.queryByRole('button', { name: 'Add 🔥 at 1:05' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'React at 1:05' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add 🔥 at 1:05' }));
    expect(props.onReact).toHaveBeenCalledWith('🔥');
    expect(props.onSignIn).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Add 🔥 at 1:05' })).toBeNull();
  });

  it('offers sign-in to a visitor instead of a dead button', () => {
    const props = renderBar({ signedIn: false });
    const button = screen.getByRole('button', { name: 'Log in to react' });
    expect(button.hasAttribute('disabled')).toBe(false);
    fireEvent.click(button);
    expect(props.onSignIn).toHaveBeenCalledTimes(1);
    expect(props.onReact).not.toHaveBeenCalled();
  });

  it('keeps reactions off when the track has comments off', () => {
    renderBar({ commentsEnabled: false });
    expect(
      screen
        .getByRole('button', { name: 'React at 1:05' })
        .hasAttribute('disabled'),
    ).toBe(true);
    expect(
      screen.queryByRole('button', { name: 'Comment at 1:05' }),
    ).toBeNull();
  });
});
