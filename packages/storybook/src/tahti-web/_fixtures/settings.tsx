import { ConnectedSettingsModal } from '@tahti-web/components/ConnectedSettingsModal';
import { useSettingsModalStore } from '@tahti-web/stores/settingsModalStore';
import type { ReactNode } from 'react';

/** The modal store is a module singleton, so each story starts it closed. */
export function resetSettingsModal(): void {
  useSettingsModalStore.setState({
    isOpen: false,
    activeTab: 'account',
    pluginCategory: null,
    artistSection: null,
    accountSection: null,
    openedToSection: false,
  });
}

/**
 * `/settings/*` and `/studio/branding` render nothing themselves: they open
 * the settings modal that AppShell keeps mounted. Render the route next to
 * that modal so the story shows what the route really shows.
 */
export function WithSettingsModal({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ConnectedSettingsModal />
    </>
  );
}
