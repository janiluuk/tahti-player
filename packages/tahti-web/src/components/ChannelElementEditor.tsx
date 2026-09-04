import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeOffIcon,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { Button, Select, Tooltip } from '@tahti-player/ui';

import {
  adjacentLookElementId,
  CHANNEL_LOOK_ELEMENTS,
  isChannelLookElementId,
  type ChannelLookElementId,
} from '../lib/channelLookElements';

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
      className={`transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
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
  const selectedMeta =
    CHANNEL_LOOK_ELEMENTS.find((element) => element.id === selectedId) ??
    CHANNEL_LOOK_ELEMENTS[0];
  const selectedItem = items.find((item) => item.id === selectedId) ?? items[0];
  const canDisable = selectedMeta?.canDisable === true;

  return (
    <section
      data-testid="channel-element-editor"
      aria-label="Channel look editor"
      className={`border-border bg-background flex min-h-0 flex-col overflow-hidden rounded-xl border ${className}`}
    >
      <header className="border-border flex flex-col gap-2 border-b p-3">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <Select
              label="Section"
              value={selectedId}
              onValueChange={(value) => {
                if (isChannelLookElementId(value)) {
                  onSelect(value);
                }
              }}
              options={CHANNEL_LOOK_ELEMENTS.map((element) => ({
                id: element.id,
                label: element.label,
              }))}
            />
          </div>
          <div className="flex shrink-0 items-center gap-1 pb-0.5">
            <Tooltip content="Previous section" side="top">
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label="Previous section"
                onClick={() => onSelect(adjacentLookElementId(selectedId, -1))}
              >
                <ChevronLeftIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip content="Next section" side="top">
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label="Next section"
                onClick={() => onSelect(adjacentLookElementId(selectedId, 1))}
              >
                <ChevronRightIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
            {canDisable ? (
              <Tooltip
                content={
                  selectedItem?.disabled
                    ? `Show ${selectedMeta.label}`
                    : `Hide ${selectedMeta.label}`
                }
                side="top"
              >
                <Button
                  size="icon-sm"
                  variant={selectedItem?.disabled ? 'secondary' : 'default'}
                  aria-pressed={!selectedItem?.disabled}
                  aria-label={
                    selectedItem?.disabled
                      ? `Show ${selectedMeta.label}`
                      : `Hide ${selectedMeta.label}`
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
        <p className="text-foreground-secondary text-xs">{selectedMeta.hint}</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
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
