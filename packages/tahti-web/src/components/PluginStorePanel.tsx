import { ChevronDownIcon } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { Box, Button, Tabs } from '@tahti-player/ui';

import {
  PLUGIN_CATEGORIES,
  pluginAudienceForTarget,
  pluginCategoriesForRole,
  type PluginCategoryId,
  type PluginCategoryTarget,
} from '../content/pluginStoreCategories';
import { getAccountRole } from '../lib/accountRoles';
import { hasNativePlayer } from '../lib/nativeCapabilities';
import { SoulseekAddonCard } from '../plugins/soulseek/SoulseekAddonCard';
import { useAuthStore } from '../stores/authStore';
import { useSettingsModalStore } from '../stores/settingsModalStore';
import { ListenAddonsPanel } from './ListenAddonsPanel';
import { RadioCategory } from './plugin-store/RadioCategory';
import {
  AudioPluginsCategory,
  ChannelCategory,
  DiscoveryCategory,
  MulticastCategory,
  ToolsCategory,
} from './plugin-store/RemainingCategories';
import {
  DspUrlPasteCard,
  ServiceCategory,
} from './plugin-store/ServiceCategory';
import { VisualizersCategory } from './plugin-store/ThemesCategory';

export function PluginStorePanel() {
  const isOpen = useSettingsModalStore((state) => state.isOpen);
  const pluginCategory = useSettingsModalStore((state) => state.pluginCategory);
  const user = useAuthStore((state) => state.user);
  const role = user ? getAccountRole(user) : 'LISTENER';
  const categories = useMemo(() => pluginCategoriesForRole(role), [role]);
  const [category, setCategory] = useState<PluginCategoryId>('listener');

  useEffect(() => {
    if (isOpen && pluginCategory) {
      setCategory(pluginAudienceForTarget(pluginCategory));
    }
  }, [isOpen, pluginCategory]);

  useEffect(() => {
    if (!categories.some((candidate) => candidate.id === category)) {
      setCategory('listener');
    }
  }, [categories, category]);

  const selectedIndex = Math.max(
    0,
    categories.findIndex((candidate) => candidate.id === category),
  );

  return (
    <div className="@container min-w-0">
      <Tabs
        vertical
        className="flex min-w-0 flex-col gap-4 @2xl:flex-row"
        listClassName="flex min-w-0 w-full flex-wrap gap-1 @2xl:w-40 @2xl:flex-nowrap @2xl:flex-col shrink-0"
        panelClassName="min-w-0 flex-1"
        selectedIndex={selectedIndex}
        onChange={(index) => setCategory(categories[index]!.id)}
        items={categories.map((candidate) => ({
          id: candidate.id,
          label: (
            <span className="flex min-w-0 items-center gap-2">
              <candidate.icon size={14} aria-hidden className="shrink-0" />
              <span className="truncate">{candidate.label}</span>
            </span>
          ),
          content: (
            <AudienceBody
              key={`${candidate.id}:${pluginCategory ?? ''}`}
              categoryId={candidate.id}
              target={pluginCategory}
            />
          ),
        }))}
      />
    </div>
  );
}

function ScrobblingMovedNotice() {
  const setActiveTab = useSettingsModalStore((s) => s.setActiveTab);
  return (
    <Box
      variant="tertiary"
      className="items-start gap-3 py-3"
      data-testid="scrobbling-moved-notice"
    >
      <p className="text-foreground text-sm">
        ListenBrainz and Last.fm scrobbling now live in Settings → Integrations.
      </p>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setActiveTab('integrations')}
      >
        Open Integrations
      </Button>
    </Box>
  );
}

function AudienceBody({
  categoryId,
  target,
}: {
  categoryId: PluginCategoryId;
  target: PluginCategoryTarget | null;
}) {
  const category = PLUGIN_CATEGORIES.find(
    (candidate) => candidate.id === categoryId,
  )!;

  return (
    <div className="flex flex-col gap-5">
      {category.description ? (
        <p className="text-foreground-secondary text-sm">
          {category.description}
        </p>
      ) : null}
      {categoryId === 'listener' ? <ListenerAddons target={target} /> : null}
      {categoryId === 'artist' ? <ArtistAddons target={target} /> : null}
      {categoryId === 'admin' ? <AdminAddons /> : null}
    </div>
  );
}

function AddonGroup({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border-border rounded-md border">
      <Button
        variant="text"
        size="flexible"
        className="w-full gap-3 rounded-none p-3 text-left whitespace-normal active:scale-100"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{title}</span>
          <span className="text-foreground-secondary block text-xs">
            {description}
          </span>
        </span>
        <ChevronDownIcon
          size={16}
          aria-hidden
          className={open ? 'rotate-180' : undefined}
        />
      </Button>
      {open ? (
        <div className="border-border flex flex-col gap-3 border-t p-3">
          {children}
        </div>
      ) : null}
    </section>
  );
}

function ListenerAddons({ target }: { target: PluginCategoryTarget | null }) {
  const initial =
    target === 'listen'
      ? 'listen'
      : target === 'discovery'
        ? 'discovery'
        : target === 'scrobbling'
          ? 'history'
          : 'radio';

  return (
    <>
      <AddonGroup
        title="Radio"
        description="Personal streams, station discovery and saved stations."
        defaultOpen={initial === 'radio'}
      >
        <RadioCategory />
      </AddonGroup>
      <AddonGroup
        title="Listen widgets"
        description="Provider embeds and widgets for your personal Listen page."
        defaultOpen={initial === 'listen'}
      >
        <ListenAddonsPanel />
      </AddonGroup>
      <AddonGroup
        title="Discover widgets"
        description="Choose the discovery panels and listener add-ons you use."
        defaultOpen={initial === 'discovery'}
      >
        <DiscoveryCategory />
      </AddonGroup>
      <AddonGroup
        title="Listening history"
        description="Send eligible listens to your own external profile."
        defaultOpen={initial === 'history'}
      >
        <ScrobblingMovedNotice />
      </AddonGroup>
    </>
  );
}

function ArtistAddons({ target }: { target: PluginCategoryTarget | null }) {
  const initial =
    target === 'export' || target === 'fingerprinting'
      ? 'releasing'
      : target === 'multicast'
        ? 'broadcast'
        : target === 'visualizers' || target === 'channel'
          ? 'channel'
          : target === 'audio-plugins'
            ? 'production'
            : 'import';

  return (
    <>
      <AddonGroup
        title="Import"
        description="Bring tracks and catalog references into your artist library."
        defaultOpen={initial === 'import'}
      >
        <ServiceCategory categoryId="import" />
        {hasNativePlayer() ? <SoulseekAddonCard /> : null}
      </AddonGroup>
      <AddonGroup
        title="Releasing and distribution"
        description="Prepare release links, delivery targets and catalog matching."
        defaultOpen={initial === 'releasing'}
      >
        <DspUrlPasteCard />
        <ServiceCategory categoryId="export" />
        <ServiceCategory categoryId="fingerprinting" />
      </AddonGroup>
      <AddonGroup
        title="Broadcast destinations"
        description="Mirror live broadcasts to external RTMP services."
        defaultOpen={initial === 'broadcast'}
      >
        <MulticastCategory />
      </AddonGroup>
      <AddonGroup
        title="Channel presentation"
        description="Visual presets and public channel widgets."
        defaultOpen={initial === 'channel'}
      >
        <VisualizersCategory />
        <ChannelCategory />
      </AddonGroup>
      <AddonGroup
        title="Production tools"
        description="Audio processing available in the Pro Editor."
        defaultOpen={initial === 'production'}
      >
        <AudioPluginsCategory />
      </AddonGroup>
    </>
  );
}

function AdminAddons() {
  return (
    <AddonGroup
      title="Platform operations"
      description="Board-only integrations and operational tools."
      defaultOpen
    >
      <ToolsCategory />
    </AddonGroup>
  );
}
