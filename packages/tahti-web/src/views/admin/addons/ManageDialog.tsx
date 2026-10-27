import { useEffect, useState } from 'react';

import {
  Button,
  Dialog,
  InlineError,
  Textarea,
  Toggle,
} from '@tahti-player/ui';

import { type AdminAddon } from '../../../api/admin';
import { ConfirmDialog } from '../../../components/ConfirmDialog';

export function ManageDialog({
  addon,
  pending,
  error,
  onClose,
  onSetEnabledByDefault,
  onSetDefaultConfig,
  onDisable,
}: {
  addon: AdminAddon | null;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSetEnabledByDefault: (addon: AdminAddon, value: boolean) => void;
  onSetDefaultConfig: (addon: AdminAddon, json: string) => void;
  onDisable: (addon: AdminAddon) => void;
}) {
  const [configText, setConfigText] = useState('');
  const [configError, setConfigError] = useState<string | null>(null);
  const [confirmDisable, setConfirmDisable] = useState(false);

  useEffect(() => {
    if (addon) {
      setConfigText(
        addon.defaultConfigJson
          ? JSON.stringify(addon.defaultConfigJson, null, 2)
          : '',
      );
      setConfigError(null);
    }
  }, [addon]);

  return (
    <Dialog.Root isOpen={addon !== null} onClose={onClose} className="max-w-lg">
      <Dialog.Title>Manage {addon?.name}</Dialog.Title>
      {addon && (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = configText.trim();
            if (!trimmed) {
              onSetDefaultConfig(addon, '');
              return;
            }
            try {
              JSON.parse(trimmed);
            } catch {
              setConfigError('Not valid JSON.');
              return;
            }
            onSetDefaultConfig(addon, trimmed);
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Enabled by default</p>
              <p className="text-foreground-secondary text-xs">
                Renders for every {addon.scope.toLowerCase()} surface with no
                explicit install.
              </p>
            </div>
            <Toggle
              checked={addon.enabledByDefault}
              disabled={pending}
              label="Enabled by default"
              onChange={(checked) => onSetEnabledByDefault(addon, checked)}
            />
          </div>
          <Textarea
            submitOnModEnter
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            label="Default settings (JSON)"
            description="Starting settings every new install gets. Leave empty to clear. Existing installs are not changed."
            aria-invalid={configError ? true : undefined}
            value={configText}
            rows={5}
            placeholder="{}"
            onChange={(event) => {
              setConfigText(event.target.value);
              setConfigError(null);
            }}
          />
          {configError ? <InlineError>{configError}</InlineError> : null}
          {error ? <InlineError>{error}</InlineError> : null}
          <div className="border-border flex items-center justify-between border-t pt-4">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => setConfirmDisable(true)}
            >
              Disable add-on
            </Button>
            <Button disabled={pending} type="submit">
              Save settings
            </Button>
          </div>
        </form>
      )}
      <ConfirmDialog
        isOpen={confirmDisable}
        title={addon ? `Disable "${addon.name}"?` : 'Disable add-on?'}
        description="Stops it rendering everywhere it's installed immediately, and notifies the author. Only a fresh bundle publish brings it back."
        confirmLabel="Disable"
        onCancel={() => setConfirmDisable(false)}
        onConfirm={() => {
          setConfirmDisable(false);
          if (addon) {
            onDisable(addon);
          }
        }}
      />
    </Dialog.Root>
  );
}
