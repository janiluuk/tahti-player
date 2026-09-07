import { PlusIcon, Trash2Icon } from 'lucide-react';

import { Button, FilterChips, Input, Tooltip } from '@tahti-player/ui';

import type { ChannelNavigationTab } from '../lib/channelPageLayout';

/** Configure the channel page's opt-in tab bar: which tabs exist, and which
 * other visible blocks appear under each one. Controlled, mirroring
 * ChannelLinksEditor — every mutation reports the full tabs array so the
 * canvas (and the live tab bar under the player) updates as the artist
 * edits, with the surrounding designer's own Save persisting the result. */
export function ChannelNavigationEditor({
  tabs,
  candidateItems,
  onChange,
}: {
  tabs: ChannelNavigationTab[];
  candidateItems: Array<{ id: string; label: string }>;
  onChange: (tabs: ChannelNavigationTab[]) => void;
}) {
  const updateLabel = (index: number, label: string) => {
    onChange(tabs.map((t, i) => (i === index ? { ...t, label } : t)));
  };

  const updateItemIds = (index: number, itemIds: string[]) => {
    onChange(tabs.map((t, i) => (i === index ? { ...t, itemIds } : t)));
  };

  const removeTab = (index: number) => {
    onChange(tabs.filter((_, i) => i !== index));
  };

  const addTab = () => {
    onChange([
      ...tabs,
      { id: `tab-${Date.now().toString(36)}`, label: '', itemIds: [] },
    ]);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-foreground-secondary text-xs">
        {tabs.length <= 1
          ? "The tab bar only shows once there's a second tab — with just one, there's nothing to switch between."
          : 'Pick which sections appear under each tab. A section left unassigned to every tab always shows, no matter which tab is active.'}
      </p>
      {tabs.map((tab, i) => (
        <div
          key={tab.id}
          className="border-border flex flex-col gap-2 rounded-lg border p-3"
        >
          <div className="flex items-center gap-1.5">
            <Input
              size="sm"
              placeholder={`Tab ${i + 1} label (e.g. Releases)`}
              value={tab.label}
              maxLength={24}
              onChange={(e) => updateLabel(i, e.target.value)}
              className="min-w-0 flex-1"
            />
            <Tooltip content="Remove tab" side="top">
              <Button
                type="button"
                size="icon-sm"
                variant="text"
                aria-label={`Remove ${tab.label || `tab ${i + 1}`}`}
                onClick={() => removeTab(i)}
              >
                <Trash2Icon size={14} aria-hidden />
              </Button>
            </Tooltip>
          </div>
          {candidateItems.length > 0 ? (
            <FilterChips
              multiple
              items={candidateItems}
              selected={tab.itemIds}
              onChange={(itemIds) => updateItemIds(i, itemIds)}
              aria-label={`Sections shown under ${tab.label || `tab ${i + 1}`}`}
            />
          ) : (
            <p className="text-foreground-secondary text-xs">
              Add another block to the page first, then assign it to a tab here.
            </p>
          )}
        </div>
      ))}
      <Button type="button" size="sm" variant="secondary" onClick={addTab}>
        <span className="inline-flex items-center gap-1.5">
          <PlusIcon size={14} aria-hidden />
          Add tab
        </span>
      </Button>
    </div>
  );
}
