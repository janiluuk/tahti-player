// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useSettingsModalStore } from '../../stores/settingsModalStore';
import { SettingsView } from './SettingsView';

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
});
