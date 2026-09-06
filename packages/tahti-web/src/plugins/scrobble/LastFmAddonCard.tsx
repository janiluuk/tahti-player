import { RadioIcon, SettingsIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, PluginStoreItem, Tooltip } from '@tahti-player/ui';

import {
  fetchMeIntegrations,
  installMeIntegration,
  lastFmOauthStartUrl,
  uninstallMeIntegration,
} from '../../api/integrations';
import { isForceMock } from '../../api/mode';

const ADDON = {
  id: 'lastfm',
  name: 'Last.fm',
  author: 'Scrobble',
  description:
    'When a Tahti track counts as a listen, submit it to your Last.fm profile. Charts and recommendations are out of scope — this is scrobbling only.',
};

export function LastFmAddonCard() {
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const { data } = await fetchMeIntegrations();
      const row = data.find((entry) => entry.slug === 'lastfm');
      setConnected(Boolean(row?.connected || row?.installed));
    } catch {
      setConnected(false);
    }
  };

  useEffect(() => {
    void refresh();
    const params = new URLSearchParams(window.location.search);
    const status = params.get('lastfm');
    if (!status) {
      return;
    }

    if (status === 'ok') {
      toast.success('Last.fm scrobbling connected.');
      void refresh();
    } else {
      toast.error(
        status === 'unconfigured'
          ? 'Last.fm is not configured on the server yet.'
          : status === 'login'
            ? 'Sign in again, then reconnect Last.fm.'
            : 'Could not connect Last.fm. Try again.',
      );
    }
    params.delete('lastfm');
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
    window.history.replaceState({}, '', next);
  }, []);

  const connect = () => {
    if (isForceMock()) {
      setBusy(true);
      void installMeIntegration('lastfm', {}).then((result) => {
        setBusy(false);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setConnected(true);
        toast.success('Last.fm scrobbling connected (mock).');
      });
      return;
    }
    const returnTo = `${window.location.origin}/settings/plugin-store`;
    window.location.assign(lastFmOauthStartUrl(returnTo));
  };

  const remove = async () => {
    setBusy(true);
    const result = await uninstallMeIntegration('lastfm');
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setConnected(false);
    toast.success('Last.fm disconnected.');
  };

  return (
    <>
      <PluginStoreItem
        icon={<RadioIcon size={22} aria-hidden />}
        name={ADDON.name}
        author={ADDON.author}
        description={ADDON.description}
        categories={['Scrobbling']}
        isInstalled={connected}
        onInstall={() => setOpen(true)}
        accessory={
          <div className="flex items-center gap-2">
            <Tooltip content="Configure Last.fm">
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label="Configure Last.fm"
                onClick={() => setOpen(true)}
              >
                <SettingsIcon size={16} />
              </Button>
            </Tooltip>
            {connected ? (
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
        <Dialog.Title>Configure Last.fm</Dialog.Title>
        <Dialog.Description>
          Connect your Last.fm account to enable scrobbling. Authorization
          continues on Last.fm.
        </Dialog.Description>
        <Dialog.Actions>
          <Dialog.Close>Cancel</Dialog.Close>
          <Button disabled={busy} onClick={connect}>
            {connected ? 'Reconnect Last.fm' : 'Connect Last.fm'}
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
}
