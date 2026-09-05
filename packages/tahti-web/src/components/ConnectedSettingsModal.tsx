import { BookOpenIcon, GithubIcon, LogInIcon } from 'lucide-react';
import { useEffect } from 'react';

import { Button, SettingsPanel } from '@tahti-player/ui';

import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { useSettingsModalStore } from '../stores/settingsModalStore';
import {
  DEFAULT_PUBLIC_SETTINGS_SECTION,
  isPublicSettingsSection,
  settingsNavForAuth,
  type SettingsSectionId,
} from '../views/settings/settingsNav';
import { SettingsSectionBody } from '../views/settings/SettingsPanels';
import { SidebarBuildInfo } from './SidebarBuildInfo';

/** Canonical Tahti Player repository. */
const GITHUB_REPO_URL = 'https://github.com/janiluuk/tahti-player';
/** Public Scalar/OpenAPI docs (packages/tahti-web/README.md). */
const API_DOCS_URL = 'https://api.tahti.live/api';
const DISCORD_URL = 'https://discord.gg/M6K43kbMa';

const footerLinkClass =
  'text-foreground-secondary hover:text-foreground hover:bg-background-secondary flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors';

/** Lucide has no Discord glyph — same hand-drawn-brand-mark pattern as
 * `SourceServiceIcon.tsx` for services outside its icon set. */
function DiscordIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor"
    >
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

/** Nuclear SettingsPanel modal wrapping Tahti settings sections. */
export function ConnectedSettingsModal() {
  const isOpen = useSettingsModalStore((s) => s.isOpen);
  const close = useSettingsModalStore((s) => s.close);
  const activeTab = useSettingsModalStore((s) => s.activeTab);
  const setActiveTab = useSettingsModalStore((s) => s.setActiveTab);
  const user = useAuthStore((s) => s.user);
  const openAuth = useAuthModalStore((s) => s.open);
  const signedIn = Boolean(user);

  const nav = settingsNavForAuth(signedIn);

  useEffect(() => {
    if (!isOpen || signedIn) {
      return;
    }
    if (!isPublicSettingsSection(activeTab)) {
      setActiveTab(DEFAULT_PUBLIC_SETTINGS_SECTION);
    }
  }, [activeTab, isOpen, setActiveTab, signedIn]);

  const resolvedTab =
    !signedIn && !isPublicSettingsSection(activeTab)
      ? DEFAULT_PUBLIC_SETTINGS_SECTION
      : activeTab;

  const tabs = nav.map((item) => {
    const Icon = item.Icon;
    return {
      id: item.id,
      label: item.label,
      icon: <Icon size={16} />,
      // Settings dialog is p-0; pad sections. `min-w-0` + slightly tighter
      // mobile padding keep wide Add-ons / Themes bodies inside the pane.
      content: () => (
        <div className={`min-w-0 p-4 md:p-6 lg:p-8`}>
          <SettingsSectionBody section={item.id} />
        </div>
      ),
    };
  });

  return (
    <SettingsPanel
      isOpen={isOpen}
      onClose={close}
      tabs={tabs}
      activeTab={resolvedTab}
      onTabChange={(tabId) => setActiveTab(tabId as SettingsSectionId)}
      navFooter={
        <div className="flex flex-col gap-2">
          {!signedIn ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openAuth('login')}
            >
              <LogInIcon size={14} aria-hidden />
              <span className="ml-1.5">Log in</span>
            </Button>
          ) : null}
          <div className="border-border flex flex-col gap-0.5 border-t pt-2">
            <div className="flex flex-col gap-0.5">
              <a
                href={GITHUB_REPO_URL}
                className={footerLinkClass}
                target="_blank"
                rel="noreferrer"
              >
                <GithubIcon size={14} aria-hidden />
                GitHub
              </a>
              <a
                href={DISCORD_URL}
                className={footerLinkClass}
                target="_blank"
                rel="noreferrer"
              >
                <DiscordIcon />
                Discord
              </a>
              <a
                href={API_DOCS_URL}
                className={footerLinkClass}
                target="_blank"
                rel="noreferrer"
              >
                <BookOpenIcon size={14} aria-hidden />
                API docs
              </a>
            </div>
            <SidebarBuildInfo />
          </div>
        </div>
      }
    />
  );
}
