import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeOffIcon,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Select, Tooltip } from '@tahti-player/ui';

import {
  channelLookElements,
  isChannelLookElementId,
  type ChannelLookElementId,
} from '../lib/channelLookElements';
import { webT } from '../lib/webT';

export type ChannelElementEditorItem = {
  id: ChannelLookElementId;
  content: ReactNode;
  disabled?: boolean;
};

type Props = {
  items: ChannelElementEditorItem[];
  selectedId: ChannelLookElementId;
  onSelect: (id: ChannelLookElementId) => void;
  onToggleDisabled?: (id: ChannelLookElementId) => void;
  className?: string;
};

function FadeSwitch({
  activeKey,
  children,
}: {
  activeKey: string;
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [activeKey]);
  return (
    <div
      key={activeKey}
      className={`flex h-full min-h-0 flex-col transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {children}
    </div>
  );
}

/** Docked look editor: pick a real channel piece, then style it below.
 * Prev/next arrows walk the list; disable hides the selected page block. */
export function ChannelElementEditor({
  items,
  selectedId,
  onSelect,
  onToggleDisabled,
  className = '',
}: Props) {
  const { t } = useTranslation('web');
  const selectedMeta =
    channelLookElements(t).find((element) => element.id === selectedId) ??
    channelLookElements(t)[0];
  const selectedItem = items.find((item) => item.id === selectedId) ?? items[0];
  const availableElements = channelLookElements(t).filter((element) =>
    items.some((item) => item.id === element.id),
  );
  const selectAdjacent = (direction: -1 | 1) => {
    const index = availableElements.findIndex(
      (element) => element.id === selectedId,
    );
    const next =
      availableElements[
        (index + direction + availableElements.length) %
          availableElements.length
      ];
    if (next) {
      onSelect(next.id);
    }
  };
  const canDisable = selectedMeta?.canDisable === true;

  return (
    <section
      data-testid="channel-element-editor"
      aria-label={t('channelElementEditor.channelLookEditor')}
      className={`flex min-h-0 flex-col overflow-hidden bg-transparent ${className}`}
    >
      <header className="border-border flex shrink-0 flex-col gap-2 border-b pb-3">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <Select
              label={t('channelElementEditor.section')}
              value={selectedId}
              onValueChange={(value) => {
                if (isChannelLookElementId(value)) {
                  onSelect(value);
                }
              }}
              options={availableElements.map((element) => ({
                id: element.id,
                label: element.label,
              }))}
            />
          </div>
          <div className="flex shrink-0 items-center gap-1 pb-0.5">
            <Tooltip
              content={t('channelElementEditor.previousSection')}
              side="top"
            >
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label={t('channelElementEditor.previousSection')}
                onClick={() => selectAdjacent(-1)}
              >
                <ChevronLeftIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip content={t('channelElementEditor.nextSection')} side="top">
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label={t('channelElementEditor.nextSection')}
                onClick={() => selectAdjacent(1)}
              >
                <ChevronRightIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
            {canDisable ? (
              <Tooltip
                content={
                  selectedItem?.disabled
                    ? webT()('a11yNamed.show', { name: selectedMeta.label })
                    : webT()('a11yNamed.hide', { name: selectedMeta.label })
                }
                side="top"
              >
                <Button
                  size="icon-sm"
                  variant={selectedItem?.disabled ? 'secondary' : 'default'}
                  aria-pressed={!selectedItem?.disabled}
                  aria-label={
                    selectedItem?.disabled
                      ? webT()('a11yNamed.show', { name: selectedMeta.label })
                      : webT()('a11yNamed.hide', { name: selectedMeta.label })
                  }
                  onClick={() => onToggleDisabled?.(selectedId)}
                >
                  {selectedItem?.disabled ? (
                    <EyeOffIcon size={15} aria-hidden />
                  ) : (
                    <EyeIcon size={15} aria-hidden />
                  )}
                </Button>
              </Tooltip>
            ) : null}
          </div>
        </div>
        <div className="border-primary bg-primary/10 rounded-md border-l-4 p-3">
          <p className="text-sm font-semibold">Editing {selectedMeta.label}</p>
          <p className="text-foreground-secondary mt-1 text-xs">
            {selectedMeta.hint}
          </p>
          {canDisable && (
            <p className="mt-2 flex items-center gap-1.5 text-xs">
              {selectedItem?.disabled ? (
                <EyeOffIcon size={14} aria-hidden />
              ) : (
                <EyeIcon size={14} aria-hidden />
              )}
              {selectedItem?.disabled
                ? t('channelElementEditorStates.hiddenFromYourPage')
                : t('channelElementEditorStates.visibleOnYourPage')}
            </p>
          )}
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-3">
        <FadeSwitch activeKey={selectedId}>
          <div
            className={
              selectedItem?.disabled ? 'opacity-50 grayscale' : undefined
            }
          >
            {selectedItem?.content}
          </div>
        </FadeSwitch>
      </div>
    </section>
  );
}
