import { ChevronDownIcon } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Box, Button, Tabs } from '@tahti-player/ui';

import {
  pluginAudienceForTarget,
  pluginCategories,
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
import { ImportTutorial } from './plugin-store/ImportTutorial';
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

const categoryKey = (id: PluginCategoryId) =>
  id === 'listener' ? 'Listener' : id === 'artist' ? 'Artist' : 'Admin';

export function PluginStorePanel() {
  const { t } = useTranslation('web');
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
              <span className="truncate">
                {t(`settingsAddOns.category${categoryKey(candidate.id)}`)}
              </span>
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
  const { t } = useTranslation('web');
  const setActiveTab = useSettingsModalStore((s) => s.setActiveTab);
  return (
    <Box
      variant="tertiary"
      className="items-start gap-3 py-3"
      data-testid="scrobbling-moved-notice"
    >
      <p className="text-foreground text-sm">
        {t('settingsAddOns.scrobblingMoved')}
      </p>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setActiveTab('integrations')}
      >
        {t('settingsAddOns.openIntegrations')}
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
  const { t } = useTranslation('web');
  const category = pluginCategories(t).find(
    (candidate) => candidate.id === categoryId,
  )!;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-foreground-secondary text-sm">
        {t(`settingsAddOns.category${categoryKey(category.id)}Description`)}
      </p>
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

  useEffect(() => {
    if (defaultOpen) {
      setOpen(true);
    }
  }, [defaultOpen]);

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
  const { t } = useTranslation('web');
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
        title={t('settingsAddOns.radio')}
        description={t('settingsAddOns.radioDescription')}
        defaultOpen={initial === 'radio'}
      >
        <RadioCategory />
      </AddonGroup>
      <AddonGroup
        title={t('settingsAddOns.listenWidgets')}
        description={t('settingsAddOns.listenWidgetsDescription')}
        defaultOpen={initial === 'listen'}
      >
        <ListenAddonsPanel />
      </AddonGroup>
      <AddonGroup
        title={t('settingsAddOns.discoverWidgets')}
        description={t('settingsAddOns.discoverWidgetsDescription')}
        defaultOpen={initial === 'discovery'}
      >
        <DiscoveryCategory />
      </AddonGroup>
      <AddonGroup
        title={t('settingsAddOns.history')}
        description={t('settingsAddOns.historyDescription')}
        defaultOpen={initial === 'history'}
      >
        <ScrobblingMovedNotice />
      </AddonGroup>
    </>
  );
}

function ArtistAddons({ target }: { target: PluginCategoryTarget | null }) {
  const { t } = useTranslation('web');
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
        title={t('settingsAddOns.import')}
        description={t('settingsAddOns.importDescription')}
        defaultOpen={initial === 'import'}
      >
        <ImportTutorial />
        <ServiceCategory categoryId="import" />
        {hasNativePlayer() ? <SoulseekAddonCard /> : null}
      </AddonGroup>
      <AddonGroup
        title={t('settingsAddOns.releasing')}
        description={t('settingsAddOns.releasingDescription')}
        defaultOpen={initial === 'releasing'}
      >
        <DspUrlPasteCard />
        <ServiceCategory categoryId="export" />
        <ServiceCategory categoryId="fingerprinting" />
      </AddonGroup>
      <AddonGroup
        title={t('settingsAddOns.broadcast')}
        description={t('settingsAddOns.broadcastDescription')}
        defaultOpen={initial === 'broadcast'}
      >
        <MulticastCategory />
      </AddonGroup>
      <AddonGroup
        title={t('settingsAddOns.channel')}
        description={t('settingsAddOns.channelDescription')}
        defaultOpen={initial === 'channel'}
      >
        <VisualizersCategory />
        <ChannelCategory />
      </AddonGroup>
      <AddonGroup
        title={t('settingsAddOns.production')}
        description={t('settingsAddOns.productionDescription')}
        defaultOpen={initial === 'production'}
      >
        <AudioPluginsCategory />
      </AddonGroup>
    </>
  );
}

function AdminAddons() {
  const { t } = useTranslation('web');
  return (
    <AddonGroup
      title={t('settingsAddOns.operations')}
      description={t('settingsAddOns.operationsDescription')}
      defaultOpen
    >
      <ToolsCategory />
    </AddonGroup>
  );
}
