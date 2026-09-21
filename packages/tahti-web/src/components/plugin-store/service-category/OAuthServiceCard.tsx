import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Input,
  MediaArtwork,
  PluginStoreItem,
  SaveButton,
} from '@tahti-player/ui';

import type { BandcampAlbum, SoundcloudTrack } from '../../../api/sources';
import { fetchMeProfile, patchMeProfile } from '../../../api/studio-extras';
import { oauthAdapterFor } from '../../../plugins/import-sources';
import { usePluginInstallStore } from '../../../stores/pluginInstallStore';
import type { ServiceAction, ServicePlugin } from '../serviceCatalog';
import { ConfigurableCard } from '../shared';

export function OAuthServiceCard({
  plugin,
  action,
}: {
  plugin: ServicePlugin;
  action: Extract<ServiceAction, { kind: 'oauth' }>;
}) {
  const adapter = useMemo(
    () => oauthAdapterFor(action.integrationId, action.oauthPath),
    [action.integrationId, action.oauthPath],
  );
  const [status, setStatus] = useState<{
    connected: boolean;
    username?: string | null;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusTick, setStatusTick] = useState(0);
  const [bandcampImporting, setBandcampImporting] = useState<string | null>(
    null,
  );
  const [profileUrl, setProfileUrl] = useState('');
  const [profileDraft, setProfileDraft] = useState('');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [bandcampAlbums, setBandcampAlbums] = useState<BandcampAlbum[]>([]);
  const [bandcampBusy, setBandcampBusy] = useState(false);
  const [bandcampMessage, setBandcampMessage] = useState<string | null>(null);
  const [scTracks, setScTracks] = useState<SoundcloudTrack[]>([]);
  const [scBusy, setScBusy] = useState(false);
  const [scMessage, setScMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adapter
      .checkStatus()
      .then((r) => {
        if (!cancelled) {
          setStatus(r.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus({ connected: false });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [adapter, statusTick]);

  useEffect(() => {
    usePluginInstallStore
      .getState()
      .setInstalled(plugin.id, Boolean(status?.connected));
  }, [plugin.id, status?.connected]);

  useEffect(() => {
    if (adapter.id !== 'bandcamp' || !status?.connected) {
      return;
    }
    let cancelled = false;
    setBandcampBusy(true);
    setBandcampMessage(null);
    adapter
      .listAlbums()
      .then((result) => {
        if (!cancelled) {
          setBandcampAlbums(result.data);
          setBandcampMessage(result.message ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBandcampMessage('Could not load your Bandcamp releases.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBandcampBusy(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [adapter, status?.connected]);

  useEffect(() => {
    if (adapter.id !== 'soundcloud' || !status?.connected) {
      return;
    }
    let cancelled = false;
    adapter
      .listTracks()
      .then((r) => {
        if (!cancelled) {
          setScTracks(r.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setScMessage('Could not load your SoundCloud tracks.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [adapter, status?.connected]);

  useEffect(() => {
    if (adapter.id !== 'soundcloud') {
      return;
    }
    let cancelled = false;
    fetchMeProfile()
      .then((r) => {
        if (cancelled) {
          return;
        }
        const value = r.data.socialLinks?.soundcloud ?? '';
        setProfileUrl(value);
        setProfileDraft(value);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [adapter]);

  const saveProfileUrl = async () => {
    const value = profileDraft.trim();
    if (!value) {
      return;
    }
    setProfileMsg(null);
    try {
      const profile = await fetchMeProfile();
      const r = await patchMeProfile({
        socialLinks: {
          ...(profile.data.socialLinks ?? {}),
          soundcloud: value,
        },
      });
      if (!r.ok) {
        toast.error(r.error);
        setProfileMsg(r.error);
        return;
      }
      setProfileUrl(value);
      setProfileDraft(value);
      setProfileMsg('Saved.');
      toast.success('SoundCloud profile URL saved.');
    } catch {
      toast.error('Could not save the SoundCloud profile URL.');
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await adapter.disconnect();
      toast.success(`Disconnected ${plugin.name}.`);
    } catch {
      toast.error(`Could not disconnect ${plugin.name}.`);
    } finally {
      setBusy(false);
      setStatusTick((n) => n + 1);
    }
  };

  const importBandcampAlbum = async (album: BandcampAlbum) => {
    if (adapter.id !== 'bandcamp') {
      return;
    }
    setBandcampImporting(album.id);
    setBandcampMessage(null);
    try {
      const result = await adapter.importAlbum(album);
      const text = result.ok
        ? `Imported ${result.count} item${result.count === 1 ? '' : 's'}.`
        : result.error;
      setBandcampMessage(text);
      (result.ok ? toast.success : toast.error)(text);
    } catch {
      toast.error('Bandcamp import failed.');
    } finally {
      setBandcampImporting(null);
    }
  };

  const importSoundcloud = async (tracks: SoundcloudTrack[], all: boolean) => {
    if (adapter.id !== 'soundcloud') {
      return;
    }
    setScBusy(true);
    try {
      const r = await adapter.importTracks(
        tracks.map((track) => ({ trackId: track.id, title: track.title })),
      );
      const text = r.ok
        ? all
          ? `Queued all ${r.count} SoundCloud tracks. Check Studio → Music.`
          : `Queued import (${r.count}). Check Studio → Music.`
        : r.error;
      setScMessage(text);
      (r.ok ? toast.success : toast.error)(text);
    } catch {
      toast.error('SoundCloud import failed.');
    } finally {
      setScBusy(false);
    }
  };

  return (
    <ConfigurableCard
      title={plugin.name}
      header={
        <PluginStoreItem
          name={plugin.name}
          author={plugin.author}
          description={plugin.description}
          isInstalled={Boolean(status?.connected)}
          onInstall={() => {
            window.location.href = adapter.oauthUrl;
          }}
          labels={{ install: 'Connect', installed: 'Connected' }}
        />
      }
    >
      {status?.connected ? (
        <>
          <p className="text-sm">
            Connected{status.username ? ` as ${status.username}` : ''}.
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="self-start"
            disabled={busy}
            onClick={() => void disconnect()}
          >
            {busy ? 'Disconnecting…' : 'Disconnect'}
          </Button>
          {adapter.id === 'bandcamp' && (
            <div className="border-border flex flex-col gap-3 border-t pt-3">
              <p className="text-sm font-medium">Your Bandcamp discography</p>
              {bandcampBusy ? (
                <p className="text-foreground-secondary text-sm">
                  Loading your releases…
                </p>
              ) : bandcampAlbums.length === 0 ? (
                <p className="text-foreground-secondary text-sm">
                  {bandcampMessage ?? 'No Bandcamp releases were found.'}
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {bandcampAlbums.map((album) => (
                    <li
                      key={album.id}
                      className="border-border flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2"
                    >
                      <MediaArtwork
                        size="thumb"
                        src={album.coverUrl}
                        alt={album.title}
                        imageReveal={false}
                        className="border-border shrink-0 rounded border"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {album.title}
                        </div>
                        <div className="text-foreground-secondary text-xs">
                          {album.type ?? 'Release'}
                          {album.trackCount != null
                            ? ` · ${album.trackCount} tracks`
                            : ''}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        disabled={bandcampImporting !== null}
                        onClick={() => void importBandcampAlbum(album)}
                      >
                        Import
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {bandcampMessage && bandcampAlbums.length > 0 ? (
                <p className="text-foreground-secondary text-xs" role="status">
                  {bandcampMessage}
                </p>
              ) : null}
            </div>
          )}
          {adapter.id === 'soundcloud' && (
            <div className="border-border flex flex-col gap-3 border-t pt-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium">Your SoundCloud tracks</p>
                {scTracks.length > 0 && (
                  <Button
                    size="sm"
                    disabled={scBusy}
                    onClick={() => void importSoundcloud(scTracks, true)}
                  >
                    {scBusy ? 'Importing…' : `Import all (${scTracks.length})`}
                  </Button>
                )}
              </div>
              {scTracks.length === 0 ? (
                <p className="text-foreground-secondary text-sm">
                  No tracks returned.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {scTracks.map((track) => (
                    <li
                      key={track.id}
                      className="border-border flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {track.title}
                      </span>
                      <Button
                        size="sm"
                        disabled={scBusy}
                        onClick={() => void importSoundcloud([track], false)}
                      >
                        Import
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {scMessage && (
                <p className="text-foreground-secondary text-xs" role="status">
                  {scMessage}
                </p>
              )}
              <Input
                label="SoundCloud profile URL"
                value={profileDraft}
                onChange={(e) => setProfileDraft(e.target.value)}
                placeholder="https://soundcloud.com/your-name"
              />
              <div className="flex items-center gap-2">
                <SaveButton
                  size="sm"
                  disabled={!profileDraft.trim() || profileDraft === profileUrl}
                  label="Save profile URL"
                  onClick={() => void saveProfileUrl()}
                />
                {profileMsg && (
                  <p className="text-foreground-secondary text-xs">
                    {profileMsg}
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-foreground-secondary text-sm">
            Not connected yet.
          </p>
          {action.instructionsHref && action.instructionsLabel && (
            <a
              href={action.instructionsHref}
              target="_blank"
              rel="noreferrer"
              className="text-sm underline underline-offset-2"
            >
              {action.instructionsLabel} →
            </a>
          )}
        </>
      )}
    </ConfigurableCard>
  );
}
