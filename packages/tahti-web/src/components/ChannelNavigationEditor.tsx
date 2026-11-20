import { PlusIcon, Trash2Icon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
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
  const { t } = useTranslation('web');
  const updateLabel = (index: number, label: string) => {
    onChange(tabs.map((tab, i) => (i === index ? { ...tab, label } : tab)));
  };

  const updateItemIds = (index: number, itemIds: string[]) => {
    onChange(tabs.map((tab, i) => (i === index ? { ...tab, itemIds } : tab)));
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
          ? t('channelNavigationEditorBatch32.singleTabHint')
          : t('channelNavigationEditorBatch32.multiTabHint')}
      </p>
      {tabs.map((tab, i) => (
        <div
          key={tab.id}
          className="border-border flex flex-col gap-2 rounded-lg border p-3"
        >
          <div className="flex items-center gap-1.5">
            <Input
              aria-label={t('channelNavigationEditorBatch32.tabLabel', {
                number: i + 1,
              })}
              size="sm"
              placeholder={t(
                'channelNavigationEditorBatch32.tabLabelPlaceholder',
                {
                  number: i + 1,
                },
              )}
              value={tab.label}
              maxLength={24}
              onChange={(e) => updateLabel(i, e.target.value)}
              className="min-w-0 flex-1"
            />
            <Tooltip
              content={t('channelNavigationEditor.removeTab')}
              side="top"
            >
              <Button
                type="button"
                size="icon-sm"
                variant="text"
                aria-label={t('channelNavigationEditorBatch32.removeName', {
                  name:
                    tab.label ||
                    t('channelNavigationEditorBatch32.tabNumber', {
                      number: i + 1,
                    }),
                })}
                onClick={() => removeTab(i)}
              >
                <Trash2Icon
                  className="text-accent-red-strong"
                  size={14}
                  aria-hidden
                />
              </Button>
            </Tooltip>
          </div>
          {candidateItems.length > 0 ? (
            <FilterChips
              multiple
              items={candidateItems}
              selected={tab.itemIds}
              onChange={(itemIds) => updateItemIds(i, itemIds)}
              aria-label={t('channelNavigationEditorBatch32.sectionsUnder', {
                name:
                  tab.label ||
                  t('channelNavigationEditorBatch32.tabNumber', {
                    number: i + 1,
                  }),
              })}
            />
          ) : (
            <p className="text-foreground-secondary text-xs">
              {t('channelNavigationEditor.addAnotherBlockToThe')}
            </p>
          )}
        </div>
      ))}
      <Button type="button" size="sm" variant="secondary" onClick={addTab}>
        <span className="inline-flex items-center gap-1.5">
          <PlusIcon size={14} aria-hidden />
          {t('channelNavigationEditor.addTab')}
        </span>
      </Button>
    </div>
  );
}
