import { SquareIcon } from 'lucide-react';

import { Button } from '@tahti-player/ui';

import { multicastProviderLabel } from '../../plugins/multicast';
import { ChannelRotationEditor } from '../ChannelRotationEditor';
import type { StreamManagerState } from './useStreamManagerState';

export function RotationBody({ state }: { state: StreamManagerState }) {
  const {
    canControl,
    signalConnected,
    ending,
    setConfirmEndOpen,
    rotationPlaying,
    rotationExpanded,
    programme,
    editableRotation,
    availableRotationItems,
    rotationBusy,
    rotationCurrentId,
    rotationEditorPlaying,
    addRotationItem,
    saveEditableRotation,
    previewRotationItem,
    targets,
  } = state;

  return (
    <>
      {canControl && signalConnected && (
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={ending}
            onClick={() => setConfirmEndOpen(true)}
            className="self-start"
          >
            <SquareIcon size={14} className="mr-1.5 fill-current" aria-hidden />
            {ending ? 'Ending…' : 'Stop stream'}
          </Button>
        </div>
      )}
      {canControl && (!rotationPlaying || rotationExpanded) && programme && (
        <ChannelRotationEditor
          items={editableRotation}
          availableItems={availableRotationItems}
          busy={rotationBusy}
          currentItemId={rotationCurrentId}
          isPlaying={rotationEditorPlaying}
          onAdd={(item) => void addRotationItem(item)}
          onReorder={(next) => void saveEditableRotation(next)}
          onRemove={(item) =>
            void saveEditableRotation(
              editableRotation.filter((candidate) => candidate.id !== item.id),
            )
          }
          onPlay={(item) => void previewRotationItem(item)}
        />
      )}

      {(!rotationPlaying || rotationExpanded) && targets.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {targets.map((target) => (
            <li
              key={target.id}
              className="border-border flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm"
            >
              <span>
                {target.label || multicastProviderLabel(target.provider)}
              </span>
              <span className="text-foreground-secondary text-xs uppercase">
                Mirroring
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
