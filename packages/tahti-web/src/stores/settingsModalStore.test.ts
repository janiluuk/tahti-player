import { beforeEach, describe, expect, it } from 'vitest';

import { useSettingsModalStore } from './settingsModalStore';

beforeEach(() => {
  useSettingsModalStore.setState({ isOpen: false, openedToSection: false });
});

describe('settingsModalStore', () => {
  it('remembers that a section was asked for', () => {
    useSettingsModalStore.getState().open('playback');

    expect(useSettingsModalStore.getState().openedToSection).toBe(true);
    expect(useSettingsModalStore.getState().activeTab).toBe('playback');
  });

  it('opens on the list when no section is asked for', () => {
    useSettingsModalStore.getState().open('playback');
    useSettingsModalStore.getState().close();
    useSettingsModalStore.getState().open();

    expect(useSettingsModalStore.getState().openedToSection).toBe(false);
    expect(useSettingsModalStore.getState().activeTab).toBe('playback');
  });
});
