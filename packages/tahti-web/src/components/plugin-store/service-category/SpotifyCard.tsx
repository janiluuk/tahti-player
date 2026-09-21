import { SearchIcon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  Input,
  PluginStoreItem,
  Toggle,
} from '@tahti-player/ui';

import {
  fetchSpotifyArtistProfile,
  linkSpotifyArtistProfile,
  unlinkSpotifyArtistProfile,
} from '../../../api/distribution';
import type { SpotifySearchTrack } from '../../../api/sources';
import type { SpotifyArtistProfile } from '../../../api/studio-types';
import { spotifySourceAdapter } from '../../../plugins/import-sources';
import { usePluginInstallStore } from '../../../stores/pluginInstallStore';
import type { ServicePlugin } from '../serviceCatalog';
import { ConfigurableCard } from '../shared';

export function SpotifyCard({ plugin }: { plugin: ServicePlugin }) {
  const [profile, setProfile] = useState<SpotifyArtistProfile | null>(null);
  const [configured, setConfigured] = useState(true);
  const [artistUrl, setArtistUrl] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<SpotifySearchTrack[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
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
        if (result.data.profile?.name) {
          setQuery(result.data.profile.name);
        }
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

  const search = async () => {
    if (!query.trim()) {
      return;
    }
    setBusy(true);
    try {
      const result = await spotifySourceAdapter.search(query.trim());
      setTracks(result.data);
      setSelected(new Set());
    } catch {
      toast.error('Spotify search failed.');
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
      setQuery(result.data.profile?.name ?? '');
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
        setTracks([]);
        setSelected(new Set());
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

  const importSelected = async () => {
    const chosen = tracks.filter((track) => selected.has(track.id));
    if (chosen.length === 0) {
      return;
    }
    setBusy(true);
    try {
      const result = await spotifySourceAdapter.importTracks(
        chosen.map((track) => ({
          trackId: track.id,
          title: track.name,
          externalUrl: track.externalUrl,
        })),
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const done = `Added ${result.count} Spotify item${result.count === 1 ? '' : 's'} as embeds.`;
      setMessage(done);
      toast.success(done);
      setSelected(new Set());
      setImportOpen(false);
    } catch {
      toast.error('Spotify import failed.');
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
          description="Link your Spotify artist profile and choose tracks to embed in your Tahti library."
          isInstalled={Boolean(profile)}
          onInstall={profile ? () => setImportOpen(true) : open}
          labels={{
            install: profile ? 'Import' : 'Configure',
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
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setImportOpen(true)}
            >
              <SearchIcon size={14} aria-hidden className="mr-1.5" /> Choose
              content
            </Button>
            <Button
              size="sm"
              variant="text"
              disabled={busy}
              onClick={() => void unlink()}
            >
              <XIcon size={14} aria-hidden className="mr-1.5" /> Unlink
            </Button>
          </div>
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
      <Dialog.Root
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        className="max-w-xl"
      >
        <Dialog.Title>Choose Spotify content</Dialog.Title>
        <Dialog.Description>
          Search the linked artist or another Spotify query, select the items
          you want, and add them as provider embeds.
        </Dialog.Description>
        <div className="flex items-end gap-3 py-4">
          <Input
            className="min-w-0 flex-1"
            label="Search Spotify"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button
            size="sm"
            onClick={() => void search()}
            disabled={busy || !query.trim()}
          >
            <SearchIcon size={15} aria-hidden /> Search
          </Button>
        </div>
        <div className="border-border flex max-h-72 flex-col gap-2 overflow-y-auto rounded-md border p-2">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="border-border flex items-center gap-2 rounded border p-2 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">{track.name}</span>
              <span className="text-foreground-secondary truncate text-xs">
                {track.artists?.join(', ')}
              </span>
              <Toggle
                label={`Select ${track.name}`}
                checked={selected.has(track.id)}
                onChange={() => toggle(track.id)}
              />
            </div>
          ))}
          {tracks.length === 0 && (
            <p className="text-foreground-secondary py-5 text-sm">
              Search to see Spotify content.
            </p>
          )}
        </div>
        <Dialog.Actions>
          <Dialog.Close>Cancel</Dialog.Close>
          <Button
            onClick={() => void importSelected()}
            disabled={busy || selected.size === 0}
          >
            Add selected ({selected.size})
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </ConfigurableCard>
  );
}
