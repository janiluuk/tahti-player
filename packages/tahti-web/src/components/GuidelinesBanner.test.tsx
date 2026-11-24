// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '../stores/authStore';
import { useNotificationInboxStore } from '../stores/notificationInboxStore';
import { GuidelinesBanner, STICKY_NOTICE_KEY } from './GuidelinesBanner';

const guidelines = {
  id: 'n1',
  type: 'GUIDELINES',
  actor: null,
  title: 'Community guidelines updated',
  body: 'Please read the new rules.',
  url: null,
  readAt: null,
  sticky: true,
  createdAt: '2026-11-01T00:00:00.000Z',
};

function signIn(id: string) {
  useAuthStore.setState({
    user: { id } as NonNullable<
      ReturnType<typeof useAuthStore.getState>['user']
    >,
  });
}

function remember(userId: string) {
  localStorage.setItem(
    STICKY_NOTICE_KEY,
    JSON.stringify({
      userId,
      id: guidelines.id,
      title: guidelines.title,
      body: guidelines.body,
      url: null,
    }),
  );
}

describe('GuidelinesBanner', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    useAuthStore.setState({ user: null });
    useNotificationInboxStore.setState({ items: [], loaded: false });
  });

  it('shows the remembered notice from the first paint, before the inbox loads', () => {
    signIn('u1');
    remember('u1');
    render(<GuidelinesBanner />);
    expect(screen.getByText('Community guidelines updated')).toBeVisible();
    expect(screen.queryByTestId('guidelines-banner-reveal')).toBeNull();
  });

  it("does not show another user's remembered notice", () => {
    signIn('u2');
    remember('u1');
    render(<GuidelinesBanner />);
    expect(screen.queryByTestId('guidelines-banner')).toBeNull();
  });

  it('clears the remembered notice when the signed-in account changes', () => {
    signIn('u1');
    remember('u1');
    render(<GuidelinesBanner />);
    expect(screen.getByText('Community guidelines updated')).toBeVisible();
    act(() => signIn('u2'));
    expect(screen.queryByTestId('guidelines-banner')).toBeNull();
  });

  it('drops the remembered notice once the inbox loads without it', () => {
    signIn('u1');
    remember('u1');
    render(<GuidelinesBanner />);
    act(() => {
      useNotificationInboxStore.setState({ items: [], loaded: true });
    });
    expect(screen.queryByTestId('guidelines-banner')).toBeNull();
    expect(localStorage.getItem(STICKY_NOTICE_KEY)).toBeNull();
  });

  it('remembers a notice that arrives, and opens it instead of jumping in', () => {
    signIn('u1');
    render(<GuidelinesBanner />);
    expect(screen.queryByTestId('guidelines-banner')).toBeNull();
    act(() => {
      useNotificationInboxStore.setState({ items: [guidelines], loaded: true });
    });
    expect(screen.getByTestId('guidelines-banner')).toBeTruthy();
    expect(screen.getByTestId('guidelines-banner-reveal')).toBeTruthy();
    expect(
      JSON.parse(localStorage.getItem(STICKY_NOTICE_KEY) ?? '{}'),
    ).toMatchObject({ userId: 'u1', id: 'n1' });
  });

  it('draws the title in the theme foreground, not the info-blue link colour', () => {
    useNotificationInboxStore.setState({
      items: [
        {
          id: 'n1',
          type: 'GUIDELINES',
          actor: null,
          title: 'Community guidelines updated',
          body: 'Please read the new rules.',
          url: null,
          readAt: null,
          sticky: true,
          createdAt: '2026-11-01T00:00:00.000Z',
        },
      ],
    });
    render(<GuidelinesBanner />);
    const banner = screen.getByTestId('guidelines-banner');
    expect(screen.getByText('Community guidelines updated')).toBeVisible();
    expect(banner.className).toContain('text-foreground');
    expect(banner.className).not.toMatch(/accent-blue/);
  });
});
