import { useEffect, useState } from 'react';

import { Button, Dialog, FilterChips } from '@tahti-player/ui';

import { type AdminAddon } from '../../../api/admin';

export function InstallPickerDialog({
  isOpen,
  candidates,
  pending,
  error,
  onCancel,
  onInstall,
}: {
  isOpen: boolean;
  candidates: AdminAddon[];
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onInstall: (widgetId: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelected(candidates[0]?.id ?? null);
    }
  }, [isOpen, candidates]);

  return (
    <Dialog.Root isOpen={isOpen} onClose={onCancel} className="max-w-md">
      <Dialog.Title>Install a widget onto this surface</Dialog.Title>
      <Dialog.Description>
        Only approved Admin-surface add-ons not already installed here are
        listed.
      </Dialog.Description>
      {candidates.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          Every approved Admin-surface add-on is already installed here. Approve
          or register another one first.
        </p>
      ) : (
        <FilterChips
          aria-label="Widget to install"
          items={candidates.map((addon) => ({
            id: addon.id,
            label: addon.name,
          }))}
          selected={selected ?? candidates[0].id}
          onChange={setSelected}
        />
      )}
      {error ? (
        <p className="text-accent-red text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button
          type="button"
          disabled={pending || !selected || candidates.length === 0}
          onClick={() => selected && onInstall(selected)}
        >
          Install
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
