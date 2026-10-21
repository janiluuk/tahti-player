// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EntitySocialHeader } from './EntitySocialHeader';
import { TahtiMemberBadge } from './TahtiMemberBadge';

vi.mock('./ChannelVisualizer', () => ({ ChannelVisualizer: () => null }));

describe('TahtiMemberBadge', () => {
  afterEach(cleanup);

  it('shows the badge and explains it in a tooltip for members', () => {
    render(<TahtiMemberBadge isMember />);
    const badge = screen.getByTestId('tahti-member-badge');
    expect(badge.textContent).toBe('Tahti ry member');
    act(() => {
      fireEvent.focus(badge);
    });
    expect(screen.getByRole('tooltip').textContent).toMatch(
      /member of the association/,
    );
  });

  it.each([false, undefined, null])(
    'is hidden when isMember is %s',
    (value) => {
      render(<TahtiMemberBadge isMember={value} />);
      expect(screen.queryByTestId('tahti-member-badge')).toBeNull();
    },
  );

  it('sits beside the title in the entity header only for members', () => {
    const { rerender } = render(<EntitySocialHeader title="Aino" isMember />);
    expect(screen.getByTestId('tahti-member-badge')).toBeTruthy();
    rerender(<EntitySocialHeader title="Aino" />);
    expect(screen.queryByTestId('tahti-member-badge')).toBeNull();
  });
});
