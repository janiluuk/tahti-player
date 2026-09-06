import { RadioIcon, SettingsIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  Input,
  PluginStoreItem,
  SaveButton,
  Tooltip,
} from '@tahti-player/ui';

import {
  fetchMeIntegrations,
  installMeIntegration,
  uninstallMeIntegration,
} from '../../api/integrations';

const ADDON = {
  id: 'listenbrainz',
  name: 'ListenBrainz',
  author: 'Scrobble',
  description:
    'When a Tahti track counts as a listen, submit it to your ListenBrainz profile. Charts and dashboards are out of scope — this is submit-listens only.',
};

export function ListenBrainzAddonCard() {
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
      <PluginStoreItem
        icon={<RadioIcon size={22} aria-hidden />}
        name={ADDON.name}
        author={ADDON.author}
        description={ADDON.description}
        categories={['Scrobbling']}
        isInstalled={installed}
        onInstall={() => setOpen(true)}
        accessory={
          <div className="flex items-center gap-2">
            <Tooltip content="Configure ListenBrainz">
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label="Configure ListenBrainz"
                onClick={() => setOpen(true)}
              >
                <SettingsIcon size={16} />
              </Button>
            </Tooltip>
            {installed ? (
              <Button
                size="sm"
                variant="secondary"
                intent="danger"
                disabled={busy}
                onClick={() => void remove()}
              >
                Disconnect
              </Button>
            ) : null}
          </div>
        }
        labels={{
          install: 'Configure',
          installed: 'Connected',
        }}
      />
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
