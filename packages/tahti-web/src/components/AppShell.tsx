import { useNavigate, useRouterState } from '@tanstack/react-router';
import {
  GaugeIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  MapIcon,
  MessageSquareIcon,
  RadioIcon,
  RssIcon,
  SettingsIcon,
  ShieldIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  PlayerShell,
  PlayerWorkspace,
  RouteTransition,
  SidebarNavigation,
  SidebarNavigationItem,
  Toaster,
} from '@nuclearplayer/ui';

import { useIsMobile } from '../hooks/useIsMobile';
import { MAIN_CONTENT_PADDING } from '../layout/contentPadding';
import { hasAccountRole } from '../lib/accountRoles';
import { diagnosticsEnabled } from '../lib/buildPolicy';
import { cn } from '../lib/cn';
import { scrollingPlaybackTitle, syncDocumentMetadata } from '../lib/seo';
import { useAuthStore } from '../stores/authStore';
import { useLayoutStore } from '../stores/layoutStore';
import { usePlayerStore } from '../stores/playerStore';
import { useSettingsModalStore } from '../stores/settingsModalStore';
import { hasSeenOnboarding } from '../views/OnboardingView';
import { AppTopNav } from './AppTopNav';
import { AudioEngine } from './AudioEngine';
import { AuthDialog } from './AuthDialog';
import { ConnectedPlayerBar } from './ConnectedPlayerBar';
import { ConnectedSettingsModal } from './ConnectedSettingsModal';
import { FullScreenPlayer } from './FullScreenPlayer';
import { MobileBottomNav, MobileDrawer } from './MobileChrome';
import { RightRailPanel } from './RightRailPanel';

function SidebarNavItems({ compact }: { compact: boolean }) {
  const isBoard = useAuthStore((state) => hasAccountRole(state.user, 'BOARD'));
  return (
    <SidebarNavigation isCompact={compact}>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-1">
        <SidebarNavigationItem
          to="/"
          icon={<GaugeIcon size={16} />}
          label="Listen"
        />
        <SidebarNavigationItem
          to="/radio"
          icon={<RadioIcon size={16} />}
          label="Radio"
        />
        <SidebarNavigationItem
          to="/feed"
          icon={<RssIcon size={16} />}
          label="Feed"
        />
        <SidebarNavigationItem
          to="/library"
          icon={<LibraryIcon size={16} />}
          label="My Library"
        />
        <SidebarNavigationItem
          to="/messages"
          icon={<MessageSquareIcon size={16} />}
          label="Messages"
        />
        <SidebarNavigationItem
          to="/studio"
          icon={<LayoutDashboardIcon size={16} />}
          label="Studio"
        />
        {isBoard && diagnosticsEnabled && (
          <SidebarNavigationItem
            to="/admin"
            icon={<ShieldIcon size={16} />}
            label="Admin"
          />
        )}
        {isBoard && (
          <SidebarNavigationItem
            to="/more"
            icon={<MapIcon size={16} />}
            label="More"
          />
        )}
      </div>
    </SidebarNavigation>
  );
}

export function AppShell() {
  const isMobile = useIsMobile();
  const {
    leftCollapsed,
    rightCollapsed,
    leftWidth,
    rightWidth,
    chatEnabled,
    toggleLeft,
    toggleRight,
    setLeftWidth,
    setRightWidth,
    setRightCollapsed,
    fullScreenPlayerOpen,
    setFullScreenPlayerOpen,
  } = useLayoutStore();
  const refresh = useAuthStore((s) => s.refresh);
  const isBoard = useAuthStore((state) => hasAccountRole(state.user, 'BOARD'));
  const userId = useAuthStore((s) => s.user?.id);
  const openSettings = useSettingsModalStore((s) => s.open);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const currentTrackId = usePlayerStore((state) => state.currentId);
  const playerQueue = usePlayerStore((state) => state.queue);
  const playerStatus = usePlayerStore((state) => state.status);
  const isLivePlayback = usePlayerStore((state) => state.isLive);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileQueueOpen, setMobileQueueOpen] = useState(false);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    syncDocumentMetadata(pathname);
  }, [pathname]);

  useEffect(() => {
    const currentItem = playerQueue.find((item) => item.id === currentTrackId);
    const radioPlaying =
      isLivePlayback &&
      (playerStatus === 'playing' || playerStatus === 'loading') &&
      currentItem;
    if (!radioPlaying) {
      return;
    }

    const artist = currentItem.track.artists
      .map((entry) => entry.name)
      .filter(Boolean)
      .join(', ');
    const title = `▶ ${currentItem.track.title}${artist ? ` — ${artist}` : ''} · Tahti Radio`;
    let offset = 0;
    document.title = scrollingPlaybackTitle(title, offset);
    const interval = window.setInterval(() => {
      offset += 1;
      document.title = scrollingPlaybackTitle(title, offset);
    }, 450);
    return () => {
      window.clearInterval(interval);
      syncDocumentMetadata(pathname);
    };
  }, [currentTrackId, isLivePlayback, pathname, playerQueue, playerStatus]);

  // First sign-in of the session: send a new user through onboarding once.
  // Skips/finishes mark the flag, so this never fires again for them.
  useEffect(() => {
    if (!userId || pathname === '/onboarding') {
      return;
    }
    if (!hasSeenOnboarding(userId)) {
      void navigate({ to: '/onboarding' });
    }
  }, [userId, pathname, navigate]);

  useEffect(() => {
    if (!isMobile) {
      return;
    }
    setRightCollapsed(true);
  }, [isMobile, setRightCollapsed]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      if (isEditing) {
        return;
      }

      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        const destinations: Record<
          string,
          '/' | '/radio' | '/feed' | '/library' | '/studio'
        > = {
          Digit1: '/',
          Digit2: '/radio',
          Digit3: '/feed',
          Digit4: '/library',
          Digit5: '/studio',
        };
        const destination = destinations[event.code];
        if (destination) {
          event.preventDefault();
          void navigate({ to: destination });
        }
        return;
      }

      if (
        event.code === 'KeyV' &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        currentTrackId
      ) {
        event.preventDefault();
        setFullScreenPlayerOpen(!fullScreenPlayerOpen);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [currentTrackId, fullScreenPlayerOpen, navigate, setFullScreenPlayerOpen]);

  return (
    <PlayerShell className={isMobile ? 'tahti-mobile-shell' : undefined}>
      <AppTopNav
        showMenuButton={isMobile}
        onOpenMenu={() => setMobileNavOpen(true)}
      />

      <AudioEngine />

      {isMobile ? (
        <div className="bg-background-secondary relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            className={cn('min-h-0 flex-1 overflow-auto', MAIN_CONTENT_PADDING)}
          >
            <RouteTransition />
          </div>
          <MobileBottomNav onOpenQueue={() => setMobileQueueOpen(true)} />
        </div>
      ) : (
        <PlayerWorkspace>
          <PlayerWorkspace.LeftSidebar
            width={leftWidth}
            isCollapsed={leftCollapsed}
            onWidthChange={setLeftWidth}
            onToggle={toggleLeft}
          >
            <SidebarNavigation isCompact={leftCollapsed}>
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-1">
                  <SidebarNavigationItem
                    to="/"
                    icon={<GaugeIcon size={16} />}
                    label="Listen"
                  />
                  <SidebarNavigationItem
                    to="/radio"
                    icon={<RadioIcon size={16} />}
                    label="Radio"
                  />
                  <SidebarNavigationItem
                    to="/feed"
                    icon={<RssIcon size={16} />}
                    label="Feed"
                  />
                  <SidebarNavigationItem
                    to="/library"
                    icon={<LibraryIcon size={16} />}
                    label="My Library"
                  />
                  <SidebarNavigationItem
                    to="/messages"
                    icon={<MessageSquareIcon size={16} />}
                    label="Messages"
                  />
                  <SidebarNavigationItem
                    to="/studio"
                    icon={<LayoutDashboardIcon size={16} />}
                    label="Studio"
                  />
                  {isBoard && diagnosticsEnabled && (
                    <SidebarNavigationItem
                      to="/admin"
                      icon={<ShieldIcon size={16} />}
                      label="Admin"
                    />
                  )}
                  {isBoard && (
                    <SidebarNavigationItem
                      to="/more"
                      icon={<MapIcon size={16} />}
                      label="More"
                    />
                  )}
                </div>
                <div className="mt-auto flex flex-col gap-1 p-1">
                  <SidebarNavigationItem
                    icon={<SettingsIcon size={16} />}
                    label="Settings"
                    onClick={() => openSettings()}
                  />
                </div>
              </div>
            </SidebarNavigation>
          </PlayerWorkspace.LeftSidebar>

          {/*
            Padding lives on Main (outside the scrollport) so titles keep
            breathing room from the pane edge while content scrolls.
          */}
          <PlayerWorkspace.Main
            className={cn('min-h-0 overflow-hidden', MAIN_CONTENT_PADDING)}
          >
            <div className="h-full overflow-auto">
              <RouteTransition />
            </div>
          </PlayerWorkspace.Main>

          {chatEnabled && (
            <PlayerWorkspace.RightSidebar
              width={rightWidth}
              isCollapsed={rightCollapsed}
              onWidthChange={setRightWidth}
              onToggle={toggleRight}
            >
              <RightRailPanel isCollapsed={rightCollapsed} />
            </PlayerWorkspace.RightSidebar>
          )}
        </PlayerWorkspace>
      )}

      <ConnectedPlayerBar />
      <FullScreenPlayer />
      <AuthDialog />
      <ConnectedSettingsModal />
      <Toaster position="bottom-right" richColors />

      <MobileDrawer
        open={mobileNavOpen}
        title="Navigate"
        side="left"
        onClose={() => setMobileNavOpen(false)}
      >
        <div
          className="flex flex-col gap-1"
          onClick={() => setMobileNavOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setMobileNavOpen(false);
            }
          }}
          role="presentation"
        >
          <SidebarNavItems compact={false} />
          <SidebarNavigation isCompact={false}>
            <SidebarNavigationItem
              icon={<SettingsIcon size={16} />}
              label="Settings"
              onClick={() => openSettings()}
            />
          </SidebarNavigation>
        </div>
      </MobileDrawer>

      <MobileDrawer
        open={mobileQueueOpen}
        side="right"
        onClose={() => setMobileQueueOpen(false)}
      >
        <RightRailPanel isCollapsed={false} />
      </MobileDrawer>
    </PlayerShell>
  );
}
