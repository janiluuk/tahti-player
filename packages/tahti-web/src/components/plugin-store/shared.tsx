import { PowerIcon, SettingsIcon } from 'lucide-react';
import { useState } from 'react';

import {
  Button,
  Dialog,
  EmptyState,
  PluginStoreItem,
  TabLabel,
  Tabs,
  Tooltip,
} from '@tahti-player/ui';

import { usePluginInstallStore } from '../../stores/pluginInstallStore';

/** Fold-out shell shared by every configurable plugin card: a gear toggle
 * next to the card that reveals an inline settings form below it (tabs
 * inside `children` when there's enough to configure to warrant them —
 * see VisualizersCategory). Every plugin gets one — nothing in this store
 * navigates away to configure itself. `header` can be a render prop when
 * the card's own primary button should also open the same panel as the
 * gear (e.g. a "Configure" button rather than an unrelated action). */
export function ConfigurableCard({
  header,
  children,
  title,
  defaultOpen = false,
  dialogClassName = 'max-w-lg',
}: {
  header: React.ReactNode | ((open: () => void) => React.ReactNode);
  children: React.ReactNode;
  title: string;
  defaultOpen?: boolean;
  /** Override the Dialog's width for plugins with more to configure than a
   * small popup can comfortably hold (e.g. HearthisCard's library browser). */
  dialogClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          {typeof header === 'function' ? header(() => setOpen(true)) : header}
        </div>
        <Tooltip content={open ? 'Hide configuration' : 'Configure'} side="top">
          <Button
            size="icon-sm"
            variant="secondary"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Hide configuration' : 'Configure'}
          >
            <SettingsIcon size={15} aria-hidden />
          </Button>
        </Tooltip>
      </div>
      <Dialog.Root
        isOpen={open}
        onClose={() => setOpen(false)}
        className={dialogClassName}
      >
        <Dialog.Title>Configure {title}</Dialog.Title>
        <div className="mt-4 flex flex-col gap-4">{children}</div>
        <Dialog.Actions>
          <Dialog.Close>Done</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
    </div>
  );
}

export function AudioPluginToggleRow({
  name,
  author,
  description,
  enabled,
  onToggle,
}: {
  name: string;
  author: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <PluginStoreItem
      name={name}
      author={author}
      description={description}
      isInstalled={enabled}
      onInstall={onToggle}
      labels={{ install: 'Activate', installed: 'Active' }}
      accessory={
        <Tooltip content={enabled ? `Deactivate ${name}` : `Activate ${name}`}>
          <Button
            size="icon-sm"
            variant={enabled ? 'default' : 'secondary'}
            onClick={() => onToggle()}
            aria-label={enabled ? `Deactivate ${name}` : `Activate ${name}`}
            aria-pressed={enabled}
          >
            <PowerIcon size={16} aria-hidden />
          </Button>
        </Tooltip>
      }
    />
  );
}

/** Splits a category's plugin list into "Installed" / "Available" tabs.
 * Install state comes from usePluginInstallStore, which each card writes
 * to once it knows its own real status (connected/configured/enabled) —
 * an id this store has never heard from defaults to "Available", same as
 * a plugin with no install concept at all (e.g. a plain distribution
 * deep-link). */
export function InstalledAvailableTabs({
  ids,
  renderItem,
  emptyInstalled = 'Nothing installed yet — check Available below.',
  emptyAvailable = 'Everything here is installed.',
}: {
  ids: string[];
  renderItem: (id: string) => React.ReactNode;
  emptyInstalled?: string;
  emptyAvailable?: string;
}) {
  const installedMap = usePluginInstallStore((s) => s.installed);
  const [tab, setTab] = useState<'installed' | 'available'>('installed');
  const installedIds = ids.filter((id) => installedMap[id]);
  const availableIds = ids.filter((id) => !installedMap[id]);
  const visibleIds = tab === 'installed' ? installedIds : availableIds;

  return (
    <div className="flex flex-col gap-3">
      <Tabs.Root
        selectedIndex={tab === 'installed' ? 0 : 1}
        onChange={(index) => setTab(index === 0 ? 'installed' : 'available')}
      >
        <Tabs.List>
          <Tabs.Tab>
            <TabLabel count={installedIds.length}>Installed</TabLabel>
          </Tabs.Tab>
          <Tabs.Tab>
            <TabLabel count={availableIds.length}>Available</TabLabel>
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>
      {visibleIds.length === 0 ? (
        <EmptyState
          size="sm"
          title={tab === 'installed' ? 'Nothing installed' : 'All installed'}
          description={tab === 'installed' ? emptyInstalled : emptyAvailable}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {visibleIds.map((id) => renderItem(id))}
        </div>
      )}
    </div>
  );
}
