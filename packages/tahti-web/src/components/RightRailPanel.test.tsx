import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useLayoutStore } from '../stores/layoutStore';
import { RightRailHeaderActions } from './RightRailHeaderActions';
import { RightRailPanel } from './RightRailPanel';

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => vi.fn(),
}));

const CHAT_OR_NOTIFICATIONS = /chat|notification/i;

describe('right rail is the queue only', () => {
  afterEach(cleanup);

  it('has no chat or notification controls, open or collapsed', () => {
    for (const isCollapsed of [false, true]) {
      render(
        <>
          <RightRailHeaderActions />
          <RightRailPanel isCollapsed={isCollapsed} />
        </>,
      );
      const labels = screen
        .queryAllByRole('button')
        .map(
          (button) =>
            `${button.getAttribute('aria-label') ?? ''} ${button.textContent ?? ''}`,
        );
      expect(
        labels.filter((label) => CHAT_OR_NOTIFICATIONS.test(label)),
      ).toEqual([]);
      cleanup();
    }
  });

  it('renders the queue view', () => {
    render(<RightRailPanel isCollapsed={false} />);
    expect(
      screen.getByTestId('right-rail').getAttribute('data-right-rail-view'),
    ).toBe('queue');
  });

  it('moves a saved chat or notifications rail back to the queue', async () => {
    localStorage.setItem(
      'tahti-web-layout',
      JSON.stringify({
        state: { rightRailTab: 'chat', chatSlug: 'yaniho', chatEnabled: true },
        version: 6,
      }),
    );
    await useLayoutStore.persist.rehydrate();
    const state = useLayoutStore.getState() as unknown as Record<
      string,
      unknown
    >;
    expect(state.rightRailTab).toBe('queue');
    expect(state.chatSlug).toBeUndefined();
    localStorage.removeItem('tahti-web-layout');
  });
});
