import { Link, Outlet } from '@tanstack/react-router';
import {
  GaugeIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  MapIcon,
  PlugIcon,
  RadioIcon,
  SettingsIcon,
  SparklesIcon,
} from 'lucide-react';
import { useEffect } from 'react';

import {
  PlayerShell,
  PlayerWorkspace,
  SidebarNavigation,
  SidebarNavigationItem,
} from '@nuclearplayer/ui';

import { useAuthStore } from '../stores/authStore';
import { useLayoutStore } from '../stores/layoutStore';
import { AudioEngine } from './AudioEngine';
import { ConnectedPlayerBar } from './ConnectedPlayerBar';
import { RightRailPanel } from './RightRailPanel';

export function AppShell() {
  const {
    leftCollapsed,
    rightCollapsed,
    leftWidth,
    rightWidth,
    toggleLeft,
    toggleRight,
    setLeftWidth,
    setRightWidth,
  } = useLayoutStore();
  const user = useAuthStore((s) => s.user);
  const refresh = useAuthStore((s) => s.refresh);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <PlayerShell className="h-dvh max-h-dvh w-dvw max-w-dvw">
      <header className="border-border bg-background flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="font-display text-lg font-extrabold tracking-tight">
            Tahti
          </span>
          <span className="text-foreground-secondary text-xs">
            Nuclear listen POC
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {user ? (
            <>
              <span className="text-foreground-secondary">
                @{user.username}
              </span>
              <button
                type="button"
                className="text-foreground-secondary hover:text-foreground underline-offset-2 hover:underline"
                onClick={() => void logout()}
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-foreground-secondary hover:text-foreground underline-offset-2 hover:underline"
            >
              Login
            </Link>
          )}
          <Link
            to="/whats-new"
            className="text-foreground-secondary hover:text-foreground flex items-center gap-1 underline-offset-2 hover:underline"
          >
            <SparklesIcon size={14} />
            What&apos;s new
          </Link>
          <a
            href="https://tahti.live"
            className="text-foreground-secondary hover:text-foreground underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            production site
          </a>
        </div>
      </header>

      <AudioEngine />

      <PlayerWorkspace>
        <PlayerWorkspace.LeftSidebar
          width={leftWidth}
          isCollapsed={leftCollapsed}
          onWidthChange={setLeftWidth}
          onToggle={toggleLeft}
        >
          <SidebarNavigation isCompact={leftCollapsed}>
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
                to="/library"
                icon={<LibraryIcon size={16} />}
                label="My Library"
              />
              <SidebarNavigationItem
                to="/studio"
                icon={<LayoutDashboardIcon size={16} />}
                label="Studio"
              />
              <SidebarNavigationItem
                to="/more"
                icon={<MapIcon size={16} />}
                label="More"
              />
              <SidebarNavigationItem
                to="/settings"
                icon={<SettingsIcon size={16} />}
                label="Settings"
              />
            </div>
          </SidebarNavigation>
        </PlayerWorkspace.LeftSidebar>

        <PlayerWorkspace.Main className="min-h-0 overflow-hidden">
          <div className="h-full min-h-0 overflow-auto p-4 md:p-6">
            <Outlet />
          </div>
        </PlayerWorkspace.Main>

        <PlayerWorkspace.RightSidebar
          width={rightWidth}
          isCollapsed={rightCollapsed}
          onWidthChange={setRightWidth}
          onToggle={toggleRight}
        >
          <RightRailPanel isCollapsed={rightCollapsed} />
        </PlayerWorkspace.RightSidebar>
      </PlayerWorkspace>

      <ConnectedPlayerBar />
    </PlayerShell>
  );
}
