import { InfoIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Box, Button, Tabs, Tooltip } from '@tahti-player/ui';

import {
  PLUGIN_CATEGORIES,
  type PluginCategoryId,
} from '../content/pluginStoreCategories';
import { getAccountRole, hasAccountRole } from '../lib/accountRoles';
import { LastFmAddonCard } from '../plugins/scrobble/LastFmAddonCard';
import { ListenBrainzAddonCard } from '../plugins/scrobble/ListenBrainzAddonCard';
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
import {
  ThemesCategory,
  VisualizersCategory,
} from './plugin-store/ThemesCategory';

/** Unified browser across the app's plugin-shaped subsystems — see
 * PLUGIN-STORE-PLAN.md for what actually turning each one into a real,
 * removable plugin would take. This view is the navigation/config layer
 * over the *existing* implementations, not a new plugin runtime: every
 * plugin configures inline, in its own gear-toggled dialog (real API
 * calls, not stubs) — nothing here navigates away to configure itself.
 *
 * Import/Export/Fingerprinting share one tagged registry (`SERVICE_PLUGINS`
 * below) so shared services can stay a single entry without duplicating
 * their configuration UI. */
export function PluginStorePanel() {
  const isOpen = useSettingsModalStore((s) => s.isOpen);
  const pluginCategory = useSettingsModalStore((s) => s.pluginCategory);
  const user = useAuthStore((s) => s.user);
  const isBoard = hasAccountRole(user, 'BOARD');
  const isArtistOrAbove = Boolean(user && getAccountRole(user) !== 'LISTENER');
  const categories = useMemo(
    () =>
      PLUGIN_CATEGORIES.filter((c) =>
        c.id === 'tools'
          ? isBoard
          : c.id === 'audio-plugins'
            ? isArtistOrAbove
            : true,
      ),
    [isBoard, isArtistOrAbove],
  );
  const [category, setCategory] = useState<PluginCategoryId>('themes');

  // The modal (and this panel) stays mounted across close/open cycles, so
  // sync on every open in case the caller requested a specific sub-tab
  // (e.g. an OAuth callback redirect landing on Import — see
  // AddToMusicActions, router.tsx's sourcesRoute redirect).
  useEffect(() => {
    if (isOpen && pluginCategory) {
      setCategory(pluginCategory);
    }
  }, [isOpen, pluginCategory]);

  useEffect(() => {
    if (!categories.some((c) => c.id === category)) {
      setCategory(categories[0]?.id ?? 'themes');
    }
  }, [categories, category]);

  const selectedIndex = Math.max(
    0,
    categories.findIndex((c) => c.id === category),
  );

  return (
    <Tabs
      vertical
      className="flex min-w-0 flex-col gap-4 sm:flex-row"
      listClassName="flex min-w-0 w-full flex-wrap gap-1 sm:w-48 sm:flex-nowrap sm:flex-col shrink-0"
      panelClassName="min-w-0 flex-1"
      selectedIndex={selectedIndex}
      onChange={(index) => setCategory(categories[index]!.id)}
      items={categories.map((c) => ({
        id: c.id,
        label: (
          <span className="flex min-w-0 items-center gap-2">
            <c.icon size={14} aria-hidden className="shrink-0" />
            <span className="truncate">{c.label}</span>
          </span>
        ),
        content: <CategoryBody categoryId={c.id} />,
      }))}
    />
  );
}

function CategoryBody({ categoryId }: { categoryId: PluginCategoryId }) {
  const category = PLUGIN_CATEGORIES.find((c) => c.id === categoryId)!;
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <Tooltip content={`About ${category.label}`} side="top">
          <Button
            size="icon-sm"
            variant="secondary"
            aria-label={`About ${category.label}`}
            aria-expanded={showInfo}
            onClick={() => setShowInfo((value) => !value)}
          >
            <InfoIcon size={16} aria-hidden />
          </Button>
        </Tooltip>
      </div>
      {showInfo ? (
        <Box
          variant="tertiary"
          role="note"
          className="border-primary/40 bg-primary/10 flex-row items-start gap-2 py-3"
        >
          <InfoIcon
            className="text-primary mt-0.5 shrink-0"
            size={16}
            aria-hidden
          />
          <p className="text-foreground text-sm">
            <span className="font-semibold">{category.label}</span>{' '}
            {category.description}
          </p>
        </Box>
      ) : null}
      {categoryId === 'themes' && <ThemesCategory />}
      {categoryId === 'visualizers' && <VisualizersCategory />}
      {categoryId === 'export' && <DspUrlPasteCard />}
      {(categoryId === 'export' ||
        categoryId === 'import' ||
        categoryId === 'fingerprinting') && (
        <ServiceCategory categoryId={categoryId} />
      )}
      {categoryId === 'import' && <SoulseekAddonCard />}
      {categoryId === 'scrobbling' && (
        <>
          <ListenBrainzAddonCard />
          <LastFmAddonCard />
        </>
      )}
      {categoryId === 'multicast' && <MulticastCategory />}
      {categoryId === 'audio-plugins' && <AudioPluginsCategory />}
      {categoryId === 'tools' && <ToolsCategory />}
      {categoryId === 'radio' && <RadioCategory />}
      {categoryId === 'listen' && <ListenAddonsPanel />}
      {categoryId === 'discovery' && <DiscoveryCategory />}
      {categoryId === 'channel' && <ChannelCategory />}
    </div>
  );
}
