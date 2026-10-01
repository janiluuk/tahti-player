import { ListPlusIcon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, ButtonLink, Input, PluginStoreItem } from '@tahti-player/ui';

import {
  fetchSpotifyArtistProfile,
  linkSpotifyArtistProfile,
  unlinkSpotifyArtistProfile,
} from '../../../api/distribution';
import type { SpotifyArtistProfile } from '../../../api/studio-types';
import { usePluginInstallStore } from '../../../stores/pluginInstallStore';
import type { ServicePlugin } from '../serviceCatalog';
import { ConfigurableCard } from '../shared';

export function SpotifyCard({ plugin }: { plugin: ServicePlugin }) {
  const [profile, setProfile] = useState<SpotifyArtistProfile | null>(null);
  const [configured, setConfigured] = useState(true);
  const [artistUrl, setArtistUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSpotifyArtistProfile()
      .then((result) => {
        if (cancelled) {
          return;
        }
        setConfigured(result.data.configured);
        setProfile(result.data.profile);
      })
      .catch(() => {
        if (!cancelled) {
          setMessage('Could not load your Spotify profile.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    usePluginInstallStore.getState().setInstalled(plugin.id, Boolean(profile));
  }, [plugin.id, profile]);

  const link = async () => {
    if (!artistUrl.trim()) {
      return;
    }
    setBusy(true);
    try {
      const result = await linkSpotifyArtistProfile(artistUrl.trim());
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setProfile(result.data.profile);
      setMessage(null);
      toast.success('Spotify profile linked.');
    } catch {
      toast.error('Could not link the Spotify profile.');
    } finally {
      setBusy(false);
    }
  };

  const unlink = async () => {
    setBusy(true);
    try {
      const result = await unlinkSpotifyArtistProfile();
      if (result.ok) {
        setProfile(null);
        toast.success('Spotify profile unlinked.');
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Could not unlink the Spotify profile.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConfigurableCard
      title={plugin.name}
      header={(open) => (
        <PluginStoreItem
          name={plugin.name}
          author={plugin.author}
          description="Link your Spotify artist profile, then add its tracks to your collections as embeds."
          isInstalled={Boolean(profile)}
          onInstall={open}
          labels={{
            install: 'Configure',
            installed: 'Configured',
          }}
        />
      )}
    >
      {!configured ? (
        <p className="text-foreground-secondary text-sm">
          Spotify import is not available until the platform Spotify credentials
          are configured.
        </p>
      ) : profile ? (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>Linked{profile.name ? `: ${profile.name}` : ''}</span>
            <ButtonLink to="/studio/collections" size="sm" variant="secondary">
              <ListPlusIcon size={14} aria-hidden className="mr-1.5" /> Add to a
              collection
            </ButtonLink>
            <Button
              size="sm"
              variant="text"
              disabled={busy}
              onClick={() => void unlink()}
            >
              <XIcon size={14} aria-hidden className="mr-1.5" /> Unlink
            </Button>
          </div>
          <p className="text-foreground-secondary text-xs">
            Open a collection and use Add from Spotify; Your tracks lists this
            artist&apos;s catalogue.
          </p>
        </>
      ) : (
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void link();
          }}
        >
          <Input
            label="Spotify artist URL"
            value={artistUrl}
            onChange={(event) => setArtistUrl(event.target.value)}
            placeholder="https://open.spotify.com/artist/…"
          />
          <Button size="sm" type="submit" disabled={busy || !artistUrl.trim()}>
            {busy ? 'Linking…' : 'Link profile'}
          </Button>
        </form>
      )}
      {message && (
        <p className="text-foreground-secondary text-xs" role="status">
          {message}
        </p>
      )}
    </ConfigurableCard>
  );
}
