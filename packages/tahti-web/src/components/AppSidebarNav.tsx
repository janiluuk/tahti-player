import { useRouterState } from '@tanstack/react-router';
import {
  CompassIcon,
  HelpCircleIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  ListMusicIcon,
  RadioIcon,
  SettingsIcon,
  ShieldIcon,
  SparklesIcon,
} from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { SidebarNavigation, SidebarNavigationItem } from '@tahti-player/ui';

import { hasAccountRole, hasStudioAccess } from '../lib/accountRoles';
import { activeSidebarItem } from '../lib/navigationActive';
import { navigationPathname } from '../lib/navigationPathname';
import { useAuthStore } from '../stores/authStore';
import { useSettingsModalStore } from '../stores/settingsModalStore';
import { MikseriSidebarWidget } from './MikseriSidebarWidget';
import { StudioMainNavItems } from './StudioNav';

export function AppSidebarNav({ compact }: { compact: boolean }) {
  const { t } = useTranslation('web');
  const isLoggedIn = useAuthStore((state) => Boolean(state.user));
  const isBoard = useAuthStore((state) => hasAccountRole(state.user, 'BOARD'));
  const isMember = useAuthStore((state) => Boolean(state.user?.isMember));
  // Until the profile loads, the stored user may lack its channel: treat the
  // account as an artist so an artist never sees the listener entry flash.
  const isListener = useAuthStore(
    (state) =>
      Boolean(state.user) &&
      state.profileLoaded &&
      !hasStudioAccess(state.user),
  );
  const openSettings = useSettingsModalStore((state) => state.open);
  const settingsModalOpen = useSettingsModalStore((state) => state.isOpen);
  const sidebarPathname = useRouterState({ select: navigationPathname });
  const sidebarActive = activeSidebarItem(sidebarPathname, {
    settingsModalOpen,
  });
  return (
    <SidebarNavigation isCompact={compact}>
      <div className="flex h-full min-h-0 flex-col p-1">
        <div className="tahti-hide-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto">
          <div data-tour-id="nav-listen">
            <SidebarNavigationItem
              to="/"
              icon={<ListMusicIcon size={16} />}
              label={t('nav.listen')}
              isSelected={sidebarActive === 'listen'}
            />
          </div>
          <div data-tour-id="nav-radio">
            <SidebarNavigationItem
              to="/radio"
              icon={<RadioIcon size={16} />}
              label={t('nav.radio')}
              isSelected={sidebarActive === 'radio'}
            />
          </div>
          <div data-tour-id="nav-discover">
            <SidebarNavigationItem
              to="/discover"
              icon={<CompassIcon size={16} />}
              label={t('nav.discover')}
              isSelected={sidebarActive === 'discover'}
            />
          </div>
          <div data-tour-id="nav-library">
            <SidebarNavigationItem
              to="/library"
              icon={<LibraryIcon size={16} />}
              label={t('nav.library')}
              isSelected={sidebarActive === 'library'}
            />
          </div>
          <div data-tour-id="nav-studio" className="flex flex-col gap-2">
            {isLoggedIn ? (
              <>
                <SidebarNavigationItem
                  to="/studio"
                  icon={
                    isListener ? (
                      <SparklesIcon size={16} />
                    ) : (
                      <LayoutDashboardIcon size={16} />
                    )
                  }
                  label={isListener ? t('nav.becomeArtist') : t('nav.studio')}
                  isSelected={sidebarActive === 'studio'}
                />
                {!isListener && <StudioMainNavItems />}
              </>
            ) : (
              <SidebarNavigationItem
                disabled
                icon={<LayoutDashboardIcon size={16} />}
                label={t('nav.studio')}
              />
            )}
          </div>
          {isMember || isBoard ? (
            <div data-tour-id="nav-coop">
              <SidebarNavigationItem
                to="/governance"
                icon={<LandmarkIcon size={16} />}
                label={t('nav.coop')}
                isSelected={sidebarActive === 'coop'}
              />
            </div>
          ) : null}
          {isBoard ? (
            <div data-tour-id="nav-admin">
              <SidebarNavigationItem
                to="/admin"
                icon={<ShieldIcon size={16} />}
                label={t('nav.admin')}
                isSelected={sidebarActive === 'admin'}
              />
            </div>
          ) : null}
          {!compact ? <MikseriSidebarWidget /> : null}
        </div>
        <div className="border-border mt-2 flex shrink-0 flex-col gap-2 border-t pt-2">
          <div data-tour-id="nav-help">
            <SidebarNavigationItem
              to="/help"
              icon={<HelpCircleIcon size={16} />}
              label={t('nav.help')}
              isSelected={sidebarActive === 'help'}
            />
          </div>
          <div data-tour-id="nav-settings">
            <SidebarNavigationItem
              icon={<SettingsIcon size={16} />}
              label={t('nav.settings')}
              onClick={() => openSettings()}
              isSelected={sidebarActive === 'settings'}
            />
          </div>
        </div>
      </div>
    </SidebarNavigation>
  );
}
