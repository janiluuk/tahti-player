// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSettingsModalStore } from '../../stores/settingsModalStore';
import { SettingsView } from './SettingsView';

vi.mock('@tanstack/react-router', () => ({
  useRouterState: ({
    select,
  }: {
    select: (state: { location: { searchStr: string } }) => string;
  }) => select({ location: { searchStr: window.location.search } }),
}));

describe('SettingsView', () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState(null, '', '/');
    useSettingsModalStore.setState({
      isOpen: false,
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
    render(<SettingsView sectionId="account" />);
    const state = useSettingsModalStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.activeTab).toBe('account');
    expect(state.accountSection).toBe('subscriptions');
  });

  it('ignores unknown account tabs', () => {
    window.history.replaceState(null, '', '/settings/account?tab=nope');
    render(<SettingsView sectionId="account" />);
    expect(useSettingsModalStore.getState().accountSection).toBeNull();
  });

  it('opens Account on API tokens from a dashboard bookmark', () => {
    window.history.replaceState(null, '', '/settings/account?tab=api-tokens');
    render(<SettingsView sectionId="account" />);
    const state = useSettingsModalStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.accountSection).toBe('api-tokens');
  });

  it('opens Artist Connections from a dashboard bookmark', () => {
    window.history.replaceState(null, '', '/settings/artist?tab=connections');
    render(<SettingsView sectionId="artist" />);
    const state = useSettingsModalStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.activeTab).toBe('artist');
    expect(state.artistSection).toBe('connections');
  });
});
