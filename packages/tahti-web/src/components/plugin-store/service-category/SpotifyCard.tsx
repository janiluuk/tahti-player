import { ListPlusIcon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
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
  const { t } = useTranslation('web');
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
      toast.success(i18n.t('web:toasts.spotifyLinked'));
    } catch {
      toast.error(i18n.t('web:toasts.spotifyLinkFailed'));
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
        toast.success(i18n.t('web:toasts.spotifyUnlinked'));
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(i18n.t('web:toasts.spotifyUnlinkFailed'));
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
          description={t('spotifyCard.linkYourSpotifyArtistProfile')}
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
          {t('spotifyCard.spotifyImportIsNotAvailable')}
        </p>
      ) : profile ? (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>Linked{profile.name ? `: ${profile.name}` : ''}</span>
            <ButtonLink to="/studio/collections" size="sm" variant="secondary">
              <ListPlusIcon size={14} aria-hidden className="mr-1.5" />{' '}
              {t('spotifyCard.addToACollection')}
            </ButtonLink>
            <Button
              size="sm"
              variant="text"
              disabled={busy}
              onClick={() => void unlink()}
            >
              <XIcon size={14} aria-hidden className="mr-1.5" />{' '}
              {t('spotifyCard.unlink')}
            </Button>
          </div>
          <p className="text-foreground-secondary text-xs">
            {t('spotifyCard.openACollectionAndUse')}
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
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            label={t('spotifyCard.spotifyArtistUrl')}
            value={artistUrl}
            onChange={(event) => setArtistUrl(event.target.value)}
            placeholder="https://open.spotify.com/artist/…"
          />
          <Button size="sm" type="submit" disabled={busy || !artistUrl.trim()}>
            {busy
              ? t('spotifyCardStates.linking')
              : t('spotifyCardStates.linkProfile')}
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
