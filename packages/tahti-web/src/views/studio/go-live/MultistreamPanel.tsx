import { ListMusicIcon, PlusIcon, PowerIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, Tooltip } from '@tahti-player/ui';

import {
  deleteRtmpTarget,
  patchRtmpTarget,
  type RtmpTarget,
} from '../../../api/broadcast';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import {
  MulticastConfigureDialog,
  type MulticastConfiguring,
} from '../../../components/MulticastConfigureDialog';
import { StudioPanel } from '../../../components/StudioPanel';
import {
  multicastProviderLabel,
  multicastProviders,
} from '../../../plugins/multicast';

/** Multistream destinations: list, enable/disable, add, configure and remove
 * (with confirmation). Owns the dialogs' state. */
export function MultistreamPanel({
  targets,
  reload,
}: {
  targets: RtmpTarget[];
  reload: () => void | Promise<void>;
}) {
  const [showAddDestination, setShowAddDestination] = useState(false);
  const [configuringDestination, setConfiguringDestination] =
    useState<MulticastConfiguring | null>(null);
  const [pendingDeleteTarget, setPendingDeleteTarget] =
    useState<RtmpTarget | null>(null);

  return (
    <>
      <StudioPanel
        title="Multistream"
        action={
          <Tooltip content="Add destination" side="top">
            <Button
              size="icon-sm"
              variant="secondary"
              onClick={() => setShowAddDestination(true)}
              aria-label="Add destination"
            >
              <PlusIcon size={16} />
            </Button>
          </Tooltip>
        }
      >
        {targets.length === 0 ? (
          <p className="text-foreground-secondary text-sm">
            No destinations configured.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {targets.map((target) => (
              <li
                key={target.id}
                className="border-border rounded-lg border px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {target.label || multicastProviderLabel(target.provider)}
                    </p>
                    <p className="text-foreground-secondary text-xs">
                      {target.enabled ? 'Enabled' : 'Disabled'} · …
                      {target.keyLast4 ?? '????'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const nextEnabled = !target.enabled;
                        void patchRtmpTarget(target.id, {
                          enabled: nextEnabled,
                        }).then((result) => {
                          if (!result.ok) {
                            toast.error(result.error);
                            return;
                          }
                          toast.success(
                            `${target.label || multicastProviderLabel(target.provider)} ${nextEnabled ? 'enabled' : 'disabled'}.`,
                          );
                          void reload();
                        });
                      }}
                    >
                      <PowerIcon size={14} aria-hidden className="mr-1.5" />
                      {target.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Tooltip content="Remove destination" side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        onClick={() => setPendingDeleteTarget(target)}
                        aria-label={`Remove ${target.label || target.provider}`}
                      >
                        <Trash2Icon size={14} aria-hidden />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </StudioPanel>

      <Dialog.Root
        isOpen={showAddDestination}
        onClose={() => setShowAddDestination(false)}
      >
        <Dialog.Title>
          <span className="inline-flex items-center gap-2">
            <ListMusicIcon size={18} aria-hidden />
            Add multistream destination
          </span>
        </Dialog.Title>
        <Dialog.Description>Choose a platform to configure.</Dialog.Description>
        <ul className="mt-4 flex flex-col gap-1.5">
          {multicastProviders
            .filter(
              (provider) => !targets.some((t) => t.provider === provider.id),
            )
            .map((provider) => (
              <li key={provider.id}>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => {
                    setShowAddDestination(false);
                    setConfiguringDestination({
                      provider: provider.id,
                      existing: null,
                    });
                  }}
                >
                  {provider.label}
                </Button>
              </li>
            ))}
        </ul>
        <Dialog.Actions>
          <Dialog.Close>Cancel</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
      {configuringDestination ? (
        <MulticastConfigureDialog
          configuring={configuringDestination}
          onClose={() => setConfiguringDestination(null)}
          onSaved={() => {
            setConfiguringDestination(null);
            void reload();
          }}
        />
      ) : null}
      <ConfirmDialog
        isOpen={pendingDeleteTarget !== null}
        title={
          pendingDeleteTarget
            ? `Remove ${pendingDeleteTarget.label || pendingDeleteTarget.provider}?`
            : 'Remove destination?'
        }
        description="This deletes the saved stream key."
        confirmLabel="Remove"
        onCancel={() => setPendingDeleteTarget(null)}
        onConfirm={() => {
          const target = pendingDeleteTarget;
          setPendingDeleteTarget(null);
          if (!target) {
            return;
          }
          void deleteRtmpTarget(target.id).then((result) => {
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success('Destination removed.');
            reload();
          });
        }}
      />
    </>
  );
}
