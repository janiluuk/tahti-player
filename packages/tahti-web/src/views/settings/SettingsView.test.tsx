// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../../stores/authStore';
import { useSettingsModalStore } from '../../stores/settingsModalStore';
import { SettingsView } from './SettingsView';

const navigate = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  useRouterState: ({
    select,
  }: {
    select: (state: {
      location: { searchStr: string; pathname: string };
    }) => string;
  }) =>
    select({
      location: {
        searchStr: window.location.search,
        pathname: window.location.pathname,
      },
    }),
}));

describe('SettingsView', () => {
  afterEach(() => {
    cleanup();
    navigate.mockClear();
    useAuthStore.setState({ user: null });
    window.history.replaceState(null, '', '/');
    useSettingsModalStore.setState({
      isOpen: false,
      dismissRouteOpen: false,
      artistSection: null,
      accountSection: null,
    });
  });

  it('opens Account on the listener subscriptions after the billing portal', () => {
    window.history.replaceState(
      null,
      '',
      '/settings/account?tab=subscriptions&fansubs=portal',
    );
    render(<SettingsView />);
    const state = useSettingsModalStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.activeTab).toBe('account');
    expect(state.accountSection).toBe('subscriptions');
  });

  it('ignores unknown account tabs', () => {
    window.history.replaceState(null, '', '/settings/account?tab=nope');
    render(<SettingsView />);
    expect(useSettingsModalStore.getState().accountSection).toBeNull();
  });

  it('opens Account on API tokens from a dashboard bookmark', () => {
    window.history.replaceState(null, '', '/settings/account?tab=api-tokens');
    render(<SettingsView />);
    const state = useSettingsModalStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.accountSection).toBe('api-tokens');
  });

  it('sends an artist to the Studio → Profile page for an old Artist tab', () => {
    useAuthStore.setState({
      user: { id: 'u1', username: 'a', channel: { slug: 'a' } } as never,
    });
    window.history.replaceState(
      null,
      '',
      '/settings/artist?tab=connections&social=instagram_connected',
    );
    render(<SettingsView />);
    expect(navigate).toHaveBeenCalledWith({
      href: '/studio/profile/connections',
      replace: true,
    });
    expect(useSettingsModalStore.getState().isOpen).toBe(false);
  });

  it('sends Following to the Library tab', () => {
    window.history.replaceState(null, '', '/settings/artist?tab=following');
    render(<SettingsView />);
    expect(navigate).toHaveBeenCalledWith({
      href: '/library/following',
      replace: true,
    });
  });

  it('opens Settings → Themes for an old Add-ons → Themes link', () => {
    window.history.replaceState(
      null,
      '',
      '/settings/plugin-store?category=themes',
    );
    render(<SettingsView />);
    expect(useSettingsModalStore.getState().activeTab).toBe('themes');
  });

  it('opens a listener profile tab from a bookmark', () => {
    window.history.replaceState(null, '', '/settings/artist?tab=connections');
    render(<SettingsView />);
    const state = useSettingsModalStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.activeTab).toBe('artist');
    expect(state.artistSection).toBe('connections');
  });

  it('follows the URL section when the route remounts mid-navigation', () => {
    useSettingsModalStore.setState({ isOpen: true, activeTab: 'themes' });
    window.history.replaceState(null, '', '/settings/themes');
    render(<SettingsView />);
    expect(useSettingsModalStore.getState().activeTab).toBe('themes');
  });

  it('opens Account on a bare /settings', () => {
    window.history.replaceState(null, '', '/settings');
    render(<SettingsView />);
    expect(useSettingsModalStore.getState().activeTab).toBe('account');
  });

  it('does not reopen while a close is navigating away from /settings', () => {
    window.history.replaceState(null, '', '/');
    render(<SettingsView />);

    expect(useSettingsModalStore.getState().isOpen).toBe(false);
  });

  it('stays closed after Close while the URL is still /settings', () => {
    window.history.replaceState(null, '', '/settings/account');
    useSettingsModalStore.getState().close();
    render(<SettingsView />);

    expect(useSettingsModalStore.getState().isOpen).toBe(false);
  });
});
