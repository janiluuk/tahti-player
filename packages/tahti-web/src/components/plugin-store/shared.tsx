import { PowerIcon, SettingsIcon } from 'lucide-react';
import { useState } from 'react';

import { Button, Dialog, PluginStoreItem, Tooltip } from '@tahti-player/ui';

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
