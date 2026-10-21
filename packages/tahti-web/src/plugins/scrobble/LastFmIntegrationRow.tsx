import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button, ExternalLink, Input } from '@tahti-player/ui';

import {
  fetchMeIntegrations,
  installMeIntegration,
  lastFmOauthStartUrl,
  prepareLastFmWithOwnKey,
  uninstallMeIntegration,
} from '../../api/integrations';
import { isForceMock } from '../../api/mode';
import { SettingsToggle } from '../../views/settings/SettingsFields';

/** Settings → Integrations row: toggle on starts the Last.fm OAuth redirect,
 * off disconnects. The OAuth callback lands back here with `?lastfm=`. */
export function LastFmIntegrationRow() {
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ownKeyOpen, setOwnKeyOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');

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

    if (status === 'unconfigured') {
      setOwnKeyOpen(true);
    }
    if (status === 'ok') {
      toast.success('Last.fm scrobbling connected.');
      void refresh();
    } else {
      toast.error(
        status === 'unconfigured'
          ? 'This server has no Last.fm API key. Use your own below.'
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
    const returnTo = `${window.location.origin}/settings/integrations`;
    window.location.assign(lastFmOauthStartUrl(returnTo));
  };

  const connectWithOwnKey = async (event: FormEvent) => {
    event.preventDefault();
    if (!apiKey.trim() || !apiSecret.trim()) {
      return;
    }
    setBusy(true);
    const result = await prepareLastFmWithOwnKey({
      apiKey,
      apiSecret,
      returnTo: `${window.location.origin}/settings/integrations`,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    window.location.assign(result.authUrl);
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
    <div data-testid="integration-lastfm">
      <SettingsToggle
        label="Last.fm scrobbling"
        description="When a Tahti track counts as a listen, submit it to your Last.fm profile. Scrobbling only, no charts or recommendations."
        value={connected}
        onChange={(next) => {
          if (busy) {
            return;
          }
          if (next) {
            connect();
          } else {
            void remove();
          }
        }}
      />
      {!connected && !isForceMock() ? (
        ownKeyOpen ? (
          <form
            className="mt-3 flex flex-col gap-3"
            onSubmit={(event) => void connectWithOwnKey(event)}
          >
            <p className="text-foreground-secondary text-xs">
              Create an API account at{' '}
              <ExternalLink href="https://www.last.fm/api/account/create">
                last.fm/api
              </ExternalLink>
              , then paste its key and shared secret. They&apos;re used for your
              account only.
            </p>
            <Input
              label="Last.fm API key"
              autoComplete="off"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
            <Input
              label="Shared secret"
              type="password"
              variant="password"
              autoComplete="off"
              value={apiSecret}
              onChange={(event) => setApiSecret(event.target.value)}
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={busy || !apiKey.trim() || !apiSecret.trim()}
              >
                {busy ? 'Opening Last.fm…' : 'Connect with my key'}
              </Button>
              <Button
                variant="text"
                size="sm"
                onClick={() => setOwnKeyOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="text"
            size="sm"
            className="mt-1"
            onClick={() => setOwnKeyOpen(true)}
          >
            Use your own Last.fm API key
          </Button>
        )
      ) : null}
    </div>
  );
}
