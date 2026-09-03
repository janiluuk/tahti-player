import { useNavigate, useRouterState } from '@tanstack/react-router';
import {
  CompassIcon,
  GaugeIcon,
  HeartIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  RadioIcon,
  SettingsIcon,
  ShieldIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  PlayerShell,
  PlayerWorkspace,
  RouteTransition,
  SidebarNavigation,
  SidebarNavigationItem,
  Toaster,
} from '@tahti-player/ui';

import { useIsCompactDesktop, useIsMobile } from '../hooks/useIsMobile';
import { MAIN_CONTENT_PADDING } from '../layout/contentPadding';
import { hasAccountRole } from '../lib/accountRoles';
import { diagnosticsEnabled } from '../lib/buildPolicy';
import { cn } from '../lib/cn';
import { activeSidebarItem } from '../lib/navigationActive';
import {
  reapplyLastMetadata,
  scrollingPlaybackTitle,
  syncDocumentMetadata,
} from '../lib/seo';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { useLayoutStore } from '../stores/layoutStore';
import { usePlayerStore } from '../stores/playerStore';
import { useSettingsModalStore } from '../stores/settingsModalStore';
import { useTourStore } from '../stores/tourStore';
import { hasSeenOnboarding } from '../views/OnboardingView';
import { AmbientBackground } from './AmbientBackground';
import { AppTopNav } from './AppTopNav';
import { AudioEngine } from './AudioEngine';
import { AuthDialog } from './AuthDialog';
import { ChannelSetupDialog } from './ChannelSetupDialog';
import { ConnectedPlayerBar } from './ConnectedPlayerBar';
import { ConnectedSettingsModal } from './ConnectedSettingsModal';
import { ConnectedStatusBar } from './ConnectedStatusBar';
import { FullScreenPlayer } from './FullScreenPlayer';
import { MobileBottomNav, MobileDrawer } from './MobileChrome';
import { NotificationToasts } from './NotificationToasts';
import { PageTourSpotlight } from './PageTourSpotlight';
import { RightRailPanel } from './RightRailPanel';
import {
  getStudioPrimaryRoute,
  StudioMainNavItems,
  StudioNav,
} from './StudioNav';

const LOADING_BAR_DELAY_MS = 1000;

const ANONYMOUS_ALLOWED_ROUTES = [
  /^\/$/,
  /^\/listen(?:\/|$)/,
  /^\/settings(?:\/|$)/,
  /^\/(login|join|apply|signup|verify|setup-password|forgot-password|reset-password)(?:\/|$)/,
  /^\/(about|privacy|terms|agpl|help|what-is-it|how-it-works|for-artists)(?:\/|$)/,
  /^\/(status|whats-new|news)(?:\/|$)/,
  /^\/(radio|discover)(?:\/|$)/,
  /^\/(channel|u|r|t|v|venues)(?:\/|$)/,
  /^\/(listen\/favorites|library\/favorites|favorites)(?:\/|$)/,
  /^\/studio(?:\/|$)/,
  /^\/transparency(?:\/|$)/,
  /^\/governance\/history(?:\/|$)/,
  /^\/governance(?:\/feature-requests)?$/,
];

function isAnonymousRouteAllowed(pathname: string) {
  return ANONYMOUS_ALLOWED_ROUTES.some((route) => route.test(pathname));
}

function SidebarNavItems({ compact }: { compact: boolean }) {
  const isLoggedIn = useAuthStore((state) => Boolean(state.user));
  const isBoard = useAuthStore((state) => hasAccountRole(state.user, 'BOARD'));
  const openSettings = useSettingsModalStore((state) => state.open);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const sidebarActive = activeSidebarItem(pathname);
  return (
    <SidebarNavigation isCompact={compact}>
      <div className="flex h-full min-h-0 flex-col p-1">
        <div className="tahti-hide-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto">
          <div data-tour-id="nav-listen">
            <SidebarNavigationItem
              to="/"
              icon={<GaugeIcon size={16} />}
              label="Listen"
              isSelected={sidebarActive === 'listen'}
            />
          </div>
          <div data-tour-id="nav-radio">
            <SidebarNavigationItem
              to="/radio"
              icon={<RadioIcon size={16} />}
              label="Radio"
              isSelected={sidebarActive === 'radio'}
            />
          </div>
          <div data-tour-id="nav-discover">
            <SidebarNavigationItem
              to="/discover"
              icon={<CompassIcon size={16} />}
              label="Discover"
              isSelected={sidebarActive === 'discover'}
            />
          </div>
          <div data-tour-id="nav-favorites">
            <SidebarNavigationItem
              to="/listen/favorites"
              icon={<HeartIcon size={16} />}
              label="Favorites"
              isSelected={sidebarActive === 'favorites'}
            />
          </div>
          <div data-tour-id="nav-studio" className="flex flex-col gap-2">
            <SidebarNavigationItem
              to="/studio"
              icon={<LayoutDashboardIcon size={16} />}
              label="Studio"
              isSelected={sidebarActive === 'studio'}
            />
            {isLoggedIn && <StudioMainNavItems />}
          </div>
          {isLoggedIn && isBoard && diagnosticsEnabled && (
            <div data-tour-id="nav-admin">
              <SidebarNavigationItem
                to="/admin"
                icon={<ShieldIcon size={16} />}
                label="Admin"
                isSelected={sidebarActive === 'admin'}
              />
            </div>
          )}
        </div>
        <div className="border-border mt-2 flex shrink-0 flex-col gap-2 border-t pt-2">
          <div data-tour-id="nav-help">
            <SidebarNavigationItem
              to="/help"
              icon={<HelpCircleIcon size={16} />}
              label="Help center"
              isSelected={sidebarActive === 'help'}
            />
          </div>
          <div data-tour-id="nav-settings">
            <SidebarNavigationItem
              icon={<SettingsIcon size={16} />}
              label="Settings"
              onClick={() => openSettings()}
              isSelected={sidebarActive === 'settings'}
            />
          </div>
        </div>
      </div>
    </SidebarNavigation>
  );
}

function RouteContent({ children }: { children: React.ReactNode }) {
  const isPending = useRouterState({
    select: (state) => state.status === 'pending',
  });
  const [showLoadingBar, setShowLoadingBar] = useState(false);

  useEffect(() => {
    if (!isPending) {
      setShowLoadingBar(false);
      return;
    }

    const timeoutId = window.setTimeout(
      () => setShowLoadingBar(true),
      LOADING_BAR_DELAY_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [isPending]);

  return (
    <div className="relative h-full min-h-0">
      <div className="h-full">{children}</div>
      {showLoadingBar ? (
        <div
          className="bg-primary pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 opacity-70"
          aria-live="polite"
          aria-label="Loading page content"
        />
      ) : null}
    </div>
  );
}

export function AppShell() {
  const isMobile = useIsMobile();
  const isCompactDesktop = useIsCompactDesktop();
  // Scoped selectors, not the whole store: layoutStore also carries chat
  // context and (during a sidebar resize drag) leftWidth/rightWidth update
  // on every mousemove -- a single unselected useLayoutStore() call would
  // re-render this entire shell, including the routed content tree, on
  // every one of those ticks.
  const leftCollapsed = useLayoutStore((s) => s.leftCollapsed);
  const rightCollapsed = useLayoutStore((s) => s.rightCollapsed);
  const leftWidth = useLayoutStore((s) => s.leftWidth);
  const rightWidth = useLayoutStore((s) => s.rightWidth);
  const toggleLeft = useLayoutStore((s) => s.toggleLeft);
  const setLeftCollapsed = useLayoutStore((s) => s.setLeftCollapsed);
  const toggleRight = useLayoutStore((s) => s.toggleRight);
  const setLeftWidth = useLayoutStore((s) => s.setLeftWidth);
  const setRightWidth = useLayoutStore((s) => s.setRightWidth);
  const setRightCollapsed = useLayoutStore((s) => s.setRightCollapsed);
  const fullScreenPlayerOpen = useLayoutStore((s) => s.fullScreenPlayerOpen);
  const setFullScreenPlayerOpen = useLayoutStore(
    (s) => s.setFullScreenPlayerOpen,
  );
  const refresh = useAuthStore((s) => s.refresh);
  const userId = useAuthStore((s) => s.user?.id);
  const authHydrated = useAuthStore((s) => s.hydrated);
  const openAuth = useAuthModalStore((s) => s.open);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigationLocation = useRouterState({
    select: (state) => state.location.pathname + state.location.searchStr,
  });
  // High-frequency in-section navigation: skips the remount-driven
  // transition so clicking around doesn't flicker or feel delayed. Covers
  // Studio/Admin/Library plus the Listen tabs (Listen/Feed/Favorites/
  // History), which all re-declare the same persistent chrome per click.
  const fastNavigationRoute =
    /^\/(studio|admin|library)(\/|$)/.test(pathname) ||
    /^\/$|^\/listen(?:\/|$)/.test(pathname);
  const currentTrackId = usePlayerStore((state) => state.currentId);
  const playerQueue = usePlayerStore((state) => state.queue);
  const playerStatus = usePlayerStore((state) => state.status);
  const isLivePlayback = usePlayerStore((state) => state.isLive);
  const toggleTour = useTourStore((state) => state.toggle);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const bottomQueueOpen = useLayoutStore((s) => s.bottomQueueOpen);
  const setBottomQueueOpen = useLayoutStore((s) => s.setBottomQueueOpen);
  const previousEditorSidebarState = useRef<boolean | null>(null);
  const isAudioEditorRoute =
    /^\/studio\/(?:archive\/[^/]+\/editor|editor\/[^/]+)$/.test(pathname);
  const anonymousRouteBlocked =
    authHydrated && !userId && !isAnonymousRouteAllowed(pathname);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!anonymousRouteBlocked) {
      return;
    }
    openAuth('login');
  }, [anonymousRouteBlocked, openAuth]);

  useEffect(() => {
    syncDocumentMetadata(pathname);
  }, [pathname]);

  useEffect(() => {
    if (isAudioEditorRoute) {
      if (previousEditorSidebarState.current === null) {
        previousEditorSidebarState.current = leftCollapsed;
        if (!leftCollapsed) {
          setLeftCollapsed(true);
        }
      }
      return;
    }

    if (previousEditorSidebarState.current !== null) {
      setLeftCollapsed(previousEditorSidebarState.current);
      previousEditorSidebarState.current = null;
    }
  }, [isAudioEditorRoute, leftCollapsed, setLeftCollapsed]);

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
      reapplyLastMetadata(pathname);
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

  // Between the mobile cutoff and ~1100px, the three-pane shell's default
  // fixed sidebar widths (220px left + 340px right) leave too little room
  // for main content -- as little as 144px at 768px, a common tablet-portrait
  // width. Collapse both sidebars there, same one-directional pattern as the
  // mobile right-rail collapse above: force collapsed on entry, never force
  // an expand, so a manual toggle at a wider viewport is still respected.
  useEffect(() => {
    if (!isCompactDesktop) {
      return;
    }
    setLeftCollapsed(true);
    setRightCollapsed(true);
  }, [isCompactDesktop, setLeftCollapsed, setRightCollapsed]);

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
        return;
      }

      if (
        event.code === 'KeyH' &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        toggleTour();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [
    currentTrackId,
    fullScreenPlayerOpen,
    navigate,
    setFullScreenPlayerOpen,
    toggleTour,
  ]);

  // The artist's own public profile is meant to feel like a standalone page
  // (a link people share), not an internal app screen: no sidebar, no
  // management icons -- just the Tahti logo (back to the app) plus compact
  // nav icons for signed-in visitors.
  const isArtistPage = /^\/u\/[^/]+/.test(pathname);

  return (
    <PlayerShell className={isMobile ? 'tahti-mobile-shell' : undefined}>
      <AppTopNav
        showMenuButton={isMobile && !isArtistPage}
        onOpenMenu={() => setMobileNavOpen(true)}
      />
      <AmbientBackground />
      <NotificationToasts />

      <AudioEngine />

      {isMobile ? (
        <div className="tahti-ambient-surface bg-background relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            className={cn(
              'min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto',
              MAIN_CONTENT_PADDING,
            )}
            data-studio-shell
          >
            {userId && getStudioPrimaryRoute(pathname) ? (
              <StudioNav current={navigationLocation} global />
            ) : null}
            <RouteContent>
              <RouteTransition
                key={userId ?? 'anonymous'}
                fast={fastNavigationRoute}
              />
            </RouteContent>
          </div>
          {!isArtistPage && <MobileBottomNav />}
        </div>
      ) : isArtistPage ? (
        <div
          className={cn(
            'tahti-ambient-surface min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto',
            MAIN_CONTENT_PADDING,
          )}
          data-studio-shell
        >
          <RouteContent>
            <RouteTransition
              key={userId ?? 'anonymous'}
              fast={fastNavigationRoute}
            />
          </RouteContent>
        </div>
      ) : (
        <PlayerWorkspace className="tahti-ambient-surface">
          <PlayerWorkspace.LeftSidebar
            width={leftWidth}
            isCollapsed={leftCollapsed}
            onWidthChange={setLeftWidth}
            onToggle={toggleLeft}
          >
            <SidebarNavItems compact={leftCollapsed} />
          </PlayerWorkspace.LeftSidebar>

          {/*
            Padding lives on Main (outside the scrollport) so titles keep
            breathing room from the pane edge while content scrolls.
          */}
          <PlayerWorkspace.Main
            className={cn(
              'tahti-ambient-surface min-h-0 min-w-0 overflow-hidden',
              MAIN_CONTENT_PADDING,
            )}
          >
            <div
              className="h-full min-w-0 overflow-x-hidden overflow-y-auto"
              data-studio-shell
            >
              {userId && getStudioPrimaryRoute(pathname) ? (
                <StudioNav current={navigationLocation} global />
              ) : null}
              <RouteContent>
                <RouteTransition
                  key={userId ?? 'anonymous'}
                  fast={fastNavigationRoute}
                />
              </RouteContent>
            </div>
          </PlayerWorkspace.Main>

          {userId && (
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
      <ConnectedStatusBar />
      <FullScreenPlayer />
      <AuthDialog />
      <ChannelSetupDialog />
      <ConnectedSettingsModal />
      <PageTourSpotlight />
      <Toaster position="bottom-right" richColors closeButton />

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
        </div>
      </MobileDrawer>

      <MobileDrawer
        open={bottomQueueOpen}
        side="right"
        onClose={() => setBottomQueueOpen(false)}
      >
        <RightRailPanel isCollapsed={false} />
      </MobileDrawer>
    </PlayerShell>
  );
}
