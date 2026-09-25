import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, Input, SaveButton } from '@tahti-player/ui';

import {
  fetchMeIntegrations,
  installMeIntegration,
  uninstallMeIntegration,
} from '../../api/integrations';
import { SettingsToggle } from '../../views/settings/SettingsFields';

/** Settings → Integrations row: toggle on opens the token dialog, off disconnects. */
export function ListenBrainzIntegrationRow() {
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const { data } = await fetchMeIntegrations();
      const row = data.find((entry) => entry.slug === 'listenbrainz');
      setInstalled(Boolean(row?.installed));
    } catch {
      setInstalled(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const saveAndEnable = async () => {
    const trimmed = token.trim();
    if (!trimmed) {
      toast.error('Paste your ListenBrainz user token first.');
      return;
    }
    setBusy(true);
    const result = await installMeIntegration('listenbrainz', {
      userToken: trimmed,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setInstalled(true);
    setOpen(false);
    setToken('');
    toast.success('ListenBrainz scrobbling enabled.');
    void refresh();
  };

  const remove = async () => {
    setBusy(true);
    const result = await uninstallMeIntegration('listenbrainz');
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setInstalled(false);
    setToken('');
    toast.success('ListenBrainz disconnected.');
  };

  return (
    <>
      <div
        className="flex flex-col gap-2"
        data-testid="integration-listenbrainz"
      >
        <SettingsToggle
          label="ListenBrainz scrobbling"
          description="When a Tahti track counts as a listen, submit it to your ListenBrainz profile. Submit-listens only, no charts."
          value={installed}
          onChange={(next) => {
            if (busy) {
              return;
            }
            if (next) {
              setOpen(true);
            } else {
              void remove();
            }
          }}
        />
        {installed ? (
          <Button
            size="sm"
            variant="text"
            className="self-start"
            onClick={() => setOpen(true)}
          >
            Update token
          </Button>
        ) : null}
      </div>
      <Dialog.Root
        isOpen={open}
        onClose={() => setOpen(false)}
        className="max-w-lg"
      >
        <Dialog.Title>Configure ListenBrainz</Dialog.Title>
        <Dialog.Description>
          Paste the user token from listenbrainz.org settings. Tahti validates
          it, stores it encrypted, and never shows it again. Eligible Tahti
          listens are submitted as ListenBrainz listens — not charts.
        </Dialog.Description>
        <div className="mt-4 flex flex-col gap-3">
          <Input
            label="User token"
            type="password"
            autoComplete="off"
            description="From listenbrainz.org → Settings → Music / User token."
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
          {installed ? (
            <p className="text-foreground-secondary text-sm">
              Already connected. Saving a new token replaces the stored one.
            </p>
          ) : null}
        </div>
        <Dialog.Actions>
          <Dialog.Close>Cancel</Dialog.Close>
          <SaveButton
            size="sm"
            saving={busy}
            disabled={busy || !token.trim()}
            onClick={() => void saveAndEnable()}
            label={installed ? 'Update token' : 'Save and enable'}
            savingLabel="Saving…"
          />
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
}
