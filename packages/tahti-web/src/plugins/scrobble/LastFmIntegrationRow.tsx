import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  fetchMeIntegrations,
  installMeIntegration,
  lastFmOauthStartUrl,
  uninstallMeIntegration,
} from '../../api/integrations';
import { isForceMock } from '../../api/mode';
import { SettingsToggle } from '../../views/settings/SettingsFields';

/** Settings → Integrations row: toggle on starts the Last.fm OAuth redirect,
 * off disconnects. The OAuth callback lands back here with `?lastfm=`. */
export function LastFmIntegrationRow() {
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
    const returnTo = `${window.location.origin}/settings/integrations`;
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
    </div>
  );
}
