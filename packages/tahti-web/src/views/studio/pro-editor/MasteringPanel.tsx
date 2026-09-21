import {
  ChevronDownIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  PlusIcon,
  Wand2Icon,
  XIcon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Card,
  CardGrid,
  Dialog,
  Slider,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import type { EditList, ProEditorPluginId } from '../../../api/studio-types';
import { StudioPanel } from '../../../components/StudioPanel';
import { AUDIO_FX_PLUGINS, useAudioFxStore } from '../../../plugins/audio-fx';
import {
  addPluginToChain,
  removePluginFromChain,
  reorderPluginChain,
} from '../../../plugins/audio-fx/chain';
import { PluginControls } from './PluginControls';
import { PluginIcon } from './pluginUi';

type Props = {
  editList: EditList;
  onChange: (next: EditList) => void;
};

/** Normalization, master gain and the drag-to-reorder audio add-on chain. */
export function MasteringPanel({ editList, onChange }: Props) {
  const [collapsed, setCollapsed] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const dragPluginRef = useRef<ProEditorPluginId | null>(null);
  const enabledPluginIds = useAudioFxStore((state) => state.enabledPluginIds);

  const pluginChain = editList.pluginChain ?? [];
  const visiblePluginChain = pluginChain.filter((id) =>
    enabledPluginIds.includes(id),
  );
  const addablePluginIds = enabledPluginIds.filter(
    (id) => !pluginChain.includes(id),
  );

  const addPlugin = (id: ProEditorPluginId) => {
    if (!addablePluginIds.includes(id)) {
      return;
    }
    onChange(addPluginToChain(editList, id));
    setPickerOpen(false);
  };

  const togglePluginEnabled = (id: ProEditorPluginId) => {
    const enabled = !AUDIO_FX_PLUGINS[id].isEnabled(editList);
    if (id === 'eq' || id === 'comp' || id === 'limiter' || id === 'filter') {
      onChange({ ...editList, [id]: { ...editList[id], enabled } });
    }
  };

  const normalize = () => {
    const enabled = !editList.loudnorm.enabled;
    onChange({ ...editList, loudnorm: { ...editList.loudnorm, enabled } });
    toast.info(
      enabled
        ? `Normalizing to ${editList.loudnorm.targetLufs} LUFS on render.`
        : 'Normalization turned off.',
    );
  };

  return (
    <>
      <StudioPanel
        title="Mastering"
        description={
          collapsed
            ? undefined
            : 'Enabled effects are audible live in Play and Preview selection — this is a real-time approximation for monitoring, not the final render.'
        }
        action={
          <Tooltip
            content={collapsed ? 'Expand mastering' : 'Minimize mastering'}
            side="top"
          >
            <Button
              size="icon-sm"
              variant="text"
              aria-label={collapsed ? 'Expand mastering' : 'Minimize mastering'}
              onClick={() => setCollapsed((v) => !v)}
            >
              {collapsed ? (
                <ChevronRightIcon size={16} aria-hidden />
              ) : (
                <ChevronDownIcon size={16} aria-hidden />
              )}
            </Button>
          </Tooltip>
        }
      >
        {!collapsed && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={editList.loudnorm.enabled ? 'default' : 'secondary'}
                onClick={normalize}
              >
                <Wand2Icon size={14} aria-hidden className="mr-1.5" />
                {editList.loudnorm.enabled
                  ? `Normalizing (${editList.loudnorm.targetLufs} LUFS)`
                  : 'Normalize'}
              </Button>
            </div>

            <Slider
              label="Master gain"
              value={editList.gainDb}
              min={-24}
              max={12}
              step={0.5}
              unit="dB"
              showFooter={false}
              className="max-w-xs"
              onValueChange={(gainDb) => onChange({ ...editList, gainDb })}
            />

            <div className="flex flex-row items-start gap-3 overflow-x-auto pb-2">
              {visiblePluginChain.length === 0 ? (
                <p className="text-foreground-secondary text-sm">
                  No audio add-ons in the chain yet.
                </p>
              ) : (
                visiblePluginChain.map((id) => {
                  const meta = AUDIO_FX_PLUGINS[id];
                  return (
                    <div
                      key={id}
                      draggable
                      onDragStart={() => {
                        dragPluginRef.current = id;
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const dragId = dragPluginRef.current;
                        dragPluginRef.current = null;
                        if (dragId && dragId !== id) {
                          onChange(reorderPluginChain(editList, dragId, id));
                        }
                      }}
                      onDragEnd={() => {
                        dragPluginRef.current = null;
                      }}
                      className="border-border bg-background-secondary/40 w-80 shrink-0 rounded-lg border p-3"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <span className="cursor-grab touch-none" aria-hidden>
                          <GripVerticalIcon
                            size={16}
                            className="text-foreground-secondary"
                          />
                        </span>
                        <div className="size-7 shrink-0 overflow-hidden rounded">
                          <PluginIcon id={id} size={16} />
                        </div>
                        <span className="text-sm font-semibold">
                          {meta.label}
                        </span>
                        <span className="text-foreground-secondary flex-1 truncate text-xs">
                          {meta.description}
                        </span>
                        <Toggle
                          checked={meta.isEnabled(editList)}
                          onChange={() => togglePluginEnabled(id)}
                          aria-label={`${meta.isEnabled(editList) ? 'Disable' : 'Enable'} ${meta.label}`}
                        />
                        <Tooltip content={`Remove ${meta.label}`} side="top">
                          <Button
                            size="icon-sm"
                            variant="text"
                            aria-label={`Remove ${meta.label}`}
                            onClick={() =>
                              onChange(removePluginFromChain(editList, id))
                            }
                          >
                            <XIcon size={14} aria-hidden />
                          </Button>
                        </Tooltip>
                      </div>
                      <PluginControls
                        id={id}
                        editList={editList}
                        onChange={onChange}
                      />
                    </div>
                  );
                })
              )}

              {addablePluginIds.length > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPickerOpen(true)}
                  className="shrink-0 self-start"
                >
                  <PlusIcon size={14} aria-hidden className="mr-1.5" />
                  Add audio add-on
                </Button>
              )}
            </div>
          </div>
        )}
      </StudioPanel>

      <Dialog.Root isOpen={pickerOpen} onClose={() => setPickerOpen(false)}>
        <Dialog.Title>Add an audio add-on</Dialog.Title>
        <CardGrid className="grid-cols-[repeat(auto-fit,minmax(8rem,1fr))]">
          {addablePluginIds.map((id) => (
            <Card
              key={id}
              title={AUDIO_FX_PLUGINS[id].label}
              subtitle={AUDIO_FX_PLUGINS[id].description}
              image={<PluginIcon id={id} />}
              onClick={() => addPlugin(id)}
            />
          ))}
        </CardGrid>
        <Dialog.Actions>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
}
