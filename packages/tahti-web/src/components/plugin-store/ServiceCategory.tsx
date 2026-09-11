import { Link, useNavigate } from '@tanstack/react-router';
import {
  CheckSquareIcon,
  DownloadIcon,
  FolderDownIcon,
  Link2Icon,
  ListPlus,
  SearchIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  ImageReveal,
  Input,
  MediaArtwork,
  PluginStoreItem,
  SaveButton,
  Select,
  TabLabel,
  Tabs,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import {
  fetchSpotifyArtistProfile,
  linkSpotifyArtistProfile,
  unlinkSpotifyArtistProfile,
} from '../../api/distribution';
import {
  playableFromHearthis,
  type BandcampAlbum,
  type HearthisLibrary,
  type HearthisTrack,
  type SoundcloudTrack,
  type SpotifySearchTrack,
} from '../../api/sources';
import {
  createStudioCollection,
  fetchStudioCollections,
  patchStudioCollection,
} from '../../api/studio';
import { fetchMeProfile, patchMeProfile } from '../../api/studio-extras';
import type {
  SpotifyArtistProfile,
  StudioCollection,
} from '../../api/studio-types';
import type { PluginCategoryId } from '../../content/pluginStoreCategories';
import {
  hearthisSourceAdapter,
  oauthAdapterFor,
  spotifySourceAdapter,
  toolSourceAdapter,
} from '../../plugins/import-sources';
import { useAuthStore } from '../../stores/authStore';
import { usePlayerStore } from '../../stores/playerStore';
import { usePluginInstallStore } from '../../stores/pluginInstallStore';
import { useSettingsModalStore } from '../../stores/settingsModalStore';
import { SourceServiceIcon } from '../SourceServiceIcon';
import {
  servicePluginsForCategory,
  type ServiceAction,
  type ServicePlugin,
} from './serviceCatalog';
import { ConfigurableCard, InstalledAvailableTabs } from './shared';

/** Paste a DSP URL (Spotify/Bandcamp/etc.) to seed a smart-link target on a
 * release — not a track/album import, so it doesn't belong in the Import
 * list above. Ported from the retired Sources page's `url` tab; the
 * "Open releases editor" action closes Add-ons first since it's a real
 * navigation to a different page. */
export function DspUrlPasteCard() {
  const [urlPaste, setUrlPaste] = useState('');
  const urlTool = toolSourceAdapter('url');

  return (
    <ConfigurableCard
      title={urlTool?.name ?? 'URL / DSP paste'}
      header={(open) => (
        <PluginStoreItem
          name={urlTool?.name ?? 'URL / DSP paste'}
          author="Tool"
          description={
            urlTool?.description ??
            'Paste Spotify/Bandcamp/etc. URLs to seed smart-link targets on a release.'
          }
          isInstalled={false}
          onInstall={open}
          labels={{ install: 'Configure' }}
        />
      )}
    >
      <p className="text-foreground-secondary text-sm">
        Paste a DSP URL to open Studio releases (smart-link targets).
      </p>
      <Input
        className="w-full"
        size="sm"
        value={urlPaste}
        onChange={(e) => setUrlPaste(e.target.value)}
        placeholder="https://open.spotify.com/track/…"
      />
      <Link
        to={(urlTool?.studioDeepLink ?? '/studio/releases') as never}
        onClick={() => useSettingsModalStore.getState().close()}
      >
        <Button size="sm" variant="secondary">
          <Link2Icon size={16} aria-hidden className="mr-1.5" />
          Open releases editor
        </Button>
      </Link>
    </ConfigurableCard>
  );
}

export function ServiceCategory({
  categoryId,
}: {
  categoryId: PluginCategoryId;
}) {
  const plugins = servicePluginsForCategory(categoryId);
  return (
    <InstalledAvailableTabs
      ids={plugins.map((p) => p.id)}
      renderItem={(id) => {
        const plugin = plugins.find((p) => p.id === id)!;
        return <ServiceCard key={id} plugin={plugin} />;
      }}
    />
  );
}

function ServiceCard({ plugin }: { plugin: ServicePlugin }) {
  // hearthis/spotify/oauth each track their own real status and write it
  // to usePluginInstallStore themselves (see those cards) — only the
  // remaining kinds (deep-link, info) are decided here, once, up front so
  // this early-return-heavy component never calls the hook conditionally.
  useEffect(() => {
    if (
      plugin.id === 'hearthis' ||
      plugin.id === 'spotify' ||
      plugin.action.kind === 'oauth'
    ) {
      return;
    }
    usePluginInstallStore
      .getState()
      .setInstalled(plugin.id, plugin.action.kind === 'info');
  }, [plugin.id, plugin.action.kind]);

  if (plugin.id === 'hearthis') {
    return <HearthisCard plugin={plugin} />;
  }
  if (plugin.id === 'spotify') {
    return <SpotifyCard plugin={plugin} />;
  }
  if (plugin.action.kind === 'oauth') {
    return <OAuthServiceCard plugin={plugin} action={plugin.action} />;
  }

  const header = (
    <PluginStoreItem
      name={plugin.name}
      author={plugin.author}
      description={plugin.description}
      isInstalled={plugin.action.kind === 'info'}
      onInstall={() => {}}
      labels={{
        install:
          plugin.action.kind === 'deep-link'
            ? (plugin.action.label ?? 'Open')
            : undefined,
        installed: 'Active',
      }}
    />
  );

  if (plugin.action.kind === 'deep-link') {
    return (
      <Link
        to={plugin.action.to}
        onClick={() => useSettingsModalStore.getState().close()}
      >
        {header}
      </Link>
    );
  }
  return header;
}

function SpotifyCard({ plugin }: { plugin: ServicePlugin }) {
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
    void fetchSpotifyArtistProfile().then((result) => {
      setConfigured(result.data.configured);
      setProfile(result.data.profile);
      if (result.data.profile?.name) {
        setQuery(result.data.profile.name);
      }
    });
  }, []);

  useEffect(() => {
    usePluginInstallStore.getState().setInstalled(plugin.id, Boolean(profile));
  }, [plugin.id, profile]);

  const search = async () => {
    if (!query.trim()) {
      return;
    }
    setBusy(true);
    const result = await spotifySourceAdapter.search(query.trim());
    setTracks(result.data);
    setSelected(new Set());
    setBusy(false);
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

  const importSelected = async () => {
    const chosen = tracks.filter((track) => selected.has(track.id));
    if (chosen.length === 0) {
      return;
    }
    setBusy(true);
    const result = await spotifySourceAdapter.importTracks(
      chosen.map((track) => ({
        trackId: track.id,
        title: track.name,
        externalUrl: track.externalUrl,
      })),
    );
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMessage(
      `Added ${result.count} Spotify item${result.count === 1 ? '' : 's'} as embeds.`,
    );
    setSelected(new Set());
    setImportOpen(false);
  };

  return (
    <ConfigurableCard
      title={plugin.name}
      header={
        <PluginStoreItem
          name={plugin.name}
          author={plugin.author}
          description="Link your Spotify artist profile and choose tracks to embed in your Tahti library."
          isInstalled={Boolean(profile)}
          onInstall={() => setImportOpen(true)}
          labels={{
            install: profile ? 'Import' : 'Configure',
            installed: 'Configured',
          }}
        />
      }
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
              onClick={() => {
                void unlinkSpotifyArtistProfile().then((result) => {
                  if (result.ok) {
                    setProfile(null);
                  } else {
                    setMessage(result.error);
                  }
                });
              }}
            >
              <XIcon size={14} aria-hidden className="mr-1.5" /> Unlink
            </Button>
          </div>
          {message && (
            <p className="text-foreground-secondary text-xs">{message}</p>
          )}
        </>
      ) : (
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!artistUrl.trim()) {
              return;
            }
            setBusy(true);
            void linkSpotifyArtistProfile(artistUrl.trim()).then((result) => {
              setBusy(false);
              if (!result.ok) {
                setMessage(result.error);
              } else {
                setProfile(result.data.profile);
                setQuery(result.data.profile?.name ?? '');
              }
            });
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
              className="border-border flex cursor-pointer items-center gap-2 rounded border p-2 text-sm"
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

function OAuthServiceCard({
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
  const [profileUrl, setProfileUrl] = useState('');
  const [profileDraft, setProfileDraft] = useState('');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [bandcampAlbums, setBandcampAlbums] = useState<BandcampAlbum[]>([]);
  const [bandcampBusy, setBandcampBusy] = useState(false);
  const [bandcampMessage, setBandcampMessage] = useState<string | null>(null);
  const [scTracks, setScTracks] = useState<SoundcloudTrack[]>([]);
  const [scBusy, setScBusy] = useState(false);
  const [scMessage, setScMessage] = useState<string | null>(null);

  const reload = () =>
    void adapter.checkStatus().then((r) => setStatus(r.data));

  useEffect(reload, [adapter]);

  useEffect(() => {
    usePluginInstallStore
      .getState()
      .setInstalled(plugin.id, Boolean(status?.connected));
  }, [plugin.id, status?.connected]);

  useEffect(() => {
    if (adapter.id !== 'bandcamp' || !status?.connected) {
      return;
    }
    setBandcampBusy(true);
    setBandcampMessage(null);
    void adapter.listAlbums().then((result) => {
      setBandcampAlbums(result.data);
      setBandcampMessage(result.message ?? null);
      setBandcampBusy(false);
    });
  }, [adapter, status?.connected]);

  useEffect(() => {
    if (adapter.id !== 'soundcloud' || !status?.connected) {
      return;
    }
    void adapter.listTracks().then((r) => setScTracks(r.data));
  }, [adapter, status?.connected]);

  useEffect(() => {
    if (adapter.id !== 'soundcloud') {
      return;
    }
    void fetchMeProfile().then((r) => {
      const value = r.data.socialLinks?.soundcloud ?? '';
      setProfileUrl(value);
      setProfileDraft(value);
    });
  }, [adapter]);

  const saveProfileUrl = () => {
    const value = profileDraft.trim();
    if (!value) {
      return;
    }
    setProfileMsg(null);
    void fetchMeProfile().then((profile) =>
      patchMeProfile({
        socialLinks: {
          ...(profile.data.socialLinks ?? {}),
          soundcloud: value,
        },
      }).then((r) => {
        if (!r.ok) {
          setProfileMsg(r.error);
          return;
        }
        setProfileUrl(value);
        setProfileDraft(value);
        setProfileMsg('Saved.');
      }),
    );
  };

  const disconnect = () => {
    setBusy(true);
    void adapter.disconnect().then(() => {
      setBusy(false);
      reload();
    });
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
            onClick={disconnect}
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
                      <ImageReveal
                        src={album.coverUrl ?? undefined}
                        alt=""
                        className="bg-background-secondary size-10 shrink-0 rounded-md"
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
                        onClick={() => {
                          if (adapter.id !== 'bandcamp') {
                            return;
                          }
                          setBandcampMessage(null);
                          void adapter.importAlbum(album).then((result) => {
                            setBandcampMessage(
                              result.ok
                                ? `Imported ${result.count} item${result.count === 1 ? '' : 's'}.`
                                : result.error,
                            );
                          });
                        }}
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
                    onClick={() => {
                      setScBusy(true);
                      void (
                        adapter.id === 'soundcloud'
                          ? adapter.importTracks(
                              scTracks.map((track) => ({
                                trackId: track.id,
                                title: track.title,
                              })),
                            )
                          : Promise.resolve({
                              ok: false as const,
                              error: 'Unavailable',
                            })
                      ).then((r) => {
                        setScBusy(false);
                        setScMessage(
                          r.ok
                            ? `Queued all ${r.count} SoundCloud tracks. Check Studio → Music.`
                            : r.error,
                        );
                      });
                    }}
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
                        onClick={() => {
                          setScBusy(true);
                          void (
                            adapter.id === 'soundcloud'
                              ? adapter.importTracks([
                                  { trackId: track.id, title: track.title },
                                ])
                              : Promise.resolve({
                                  ok: false as const,
                                  error: 'Unavailable',
                                })
                          ).then((r) => {
                            setScBusy(false);
                            setScMessage(
                              r.ok
                                ? `Queued import (${r.count}). Check Studio → Music.`
                                : r.error,
                            );
                          });
                        }}
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
                  onClick={saveProfileUrl}
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

const HEARTHIS_IMPORTS_STORAGE_KEY = 'tahti-web-hearthis-imports';
const NEW_PLAYLIST_DESTINATION = '__new_playlist__';

function HearthisCard({ plugin }: { plugin: ServicePlugin }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);

  const [handle, setHandle] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [library, setLibrary] = useState<HearthisLibrary | null>(null);
  const [libraryBusy, setLibraryBusy] = useState(false);
  const [tab, setTab] = useState<'tracks' | 'sets' | 'collections' | 'search'>(
    'tracks',
  );
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<HearthisTrack[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [destinationCollections, setDestinationCollections] = useState<
    StudioCollection[]
  >([]);
  const [destinationId, setDestinationId] = useState('');
  const [newDestinationName, setNewDestinationName] = useState('');

  useEffect(() => {
    void fetchMeProfile().then((r) => {
      setHandle(r.data.socialLinks?.hearthisAt ?? null);
    });
  }, []);

  useEffect(() => {
    usePluginInstallStore.getState().setInstalled(plugin.id, Boolean(handle));
  }, [plugin.id, handle]);

  const loadLibrary = () => {
    if (!user) {
      return;
    }
    setLibraryBusy(true);
    void Promise.all([
      hearthisSourceAdapter.library(),
      fetchStudioCollections(),
    ]).then(([libraryResult, collectionResult]) => {
      setLibraryBusy(false);
      setLibrary(libraryResult.data);
      setDestinationCollections(collectionResult.data);
      setDestinationId(
        (current) =>
          current || (collectionResult.data.find((c) => c.id)?.id ?? ''),
      );
    });
  };

  useEffect(loadLibrary, [user]);

  useEffect(() => {
    if (!user || typeof localStorage === 'undefined') {
      return;
    }
    try {
      const stored = JSON.parse(
        localStorage.getItem(`${HEARTHIS_IMPORTS_STORAGE_KEY}:${user.id}`) ??
          '[]',
      ) as unknown;
      setImportedIds(
        new Set(
          Array.isArray(stored)
            ? stored.filter((id): id is string => typeof id === 'string')
            : [],
        ),
      );
    } catch {
      setImportedIds(new Set());
    }
  }, [user]);

  const save = () => {
    const value = draft.trim().replace(/^@/, '');
    if (!value) {
      return;
    }
    setSaving(true);
    setMsg(null);
    void fetchMeProfile().then((profile) =>
      patchMeProfile({
        socialLinks: { ...(profile.data.socialLinks ?? {}), hearthisAt: value },
      }).then((r) => {
        setSaving(false);
        if (!r.ok) {
          setMsg(r.error);
          return;
        }
        setHandle(value);
        setDraft('');
        setMsg('Saved.');
        loadLibrary();
      }),
    );
  };

  const visibleTracks =
    tab === 'tracks'
      ? (library?.tracks ?? [])
      : tab === 'sets'
        ? (library?.sets ?? [])
        : tab === 'search'
          ? hits
          : [];
  const playlistDestinations = destinationCollections.filter(
    (c) => !c.style || c.style === 'PLAYLIST',
  );

  const toggleSelected = (id: string) => {
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

  const resolveDestinationId = async (): Promise<string | null> => {
    if (destinationId !== NEW_PLAYLIST_DESTINATION) {
      return destinationId || null;
    }
    const name = newDestinationName.trim();
    if (!name) {
      setMsg('Give the new playlist a name first.');
      return null;
    }
    const created = await createStudioCollection({
      name,
      style: 'PLAYLIST',
      isPublic: false,
    });
    if (!created.ok || !created.data.id) {
      setMsg(created.ok ? 'Created playlist has no import ID.' : created.error);
      return null;
    }
    setDestinationCollections((current) => [created.data, ...current]);
    setDestinationId(created.data.id);
    setNewDestinationName('');
    toast.success(`Created playlist “${created.data.name}”.`);
    return created.data.id;
  };

  const persistImportedIds = (nextImportedIds: Set<string>) => {
    if (user && typeof localStorage !== 'undefined') {
      localStorage.setItem(
        `${HEARTHIS_IMPORTS_STORAGE_KEY}:${user.id}`,
        JSON.stringify([...nextImportedIds]),
      );
    }
  };

  const importTracksToDestination = async (tracks: HearthisTrack[]) => {
    const resolvedDestinationId = await resolveDestinationId();
    if (!resolvedDestinationId) {
      setMsg((current) => current ?? 'Choose or create a playlist first.');
      return;
    }
    const pendingTracks = tracks.filter((track) => !importedIds.has(track.id));
    if (pendingTracks.length === 0) {
      setMsg(
        'Already imported — each hearthis.at item can only be imported once.',
      );
      toast.info('These hearthis.at tracks are already in your library.');
      return;
    }
    setBusy(true);
    const notificationId = toast.loading(
      `Import started for ${pendingTracks.length} item${pendingTracks.length === 1 ? '' : 's'}…`,
    );
    const result = await hearthisSourceAdapter.importTracks(
      resolvedDestinationId,
      pendingTracks,
    );
    setBusy(false);
    setSelected(new Set());
    const nextImportedIds = new Set(importedIds);
    result.items.forEach((item) => nextImportedIds.add(item.trackId));
    setImportedIds(nextImportedIds);
    persistImportedIds(nextImportedIds);
    const completionMessage =
      result.failed > 0
        ? `Imported ${result.imported}; ${result.failed} could not be imported.`
        : result.artworkFailed > 0
          ? `Imported ${result.imported} item${result.imported === 1 ? '' : 's'}; ${result.artworkFailed} cover${result.artworkFailed === 1 ? '' : 's'} could not be stored.`
          : `Import completed — ${result.imported} item${result.imported === 1 ? '' : 's'} added to the playlist.`;
    setMsg(completionMessage);
    const firstItem = result.items[0];
    if (firstItem) {
      toast.success(completionMessage, {
        id: notificationId,
        action: {
          label: result.items.length === 1 ? 'Open track' : 'Open first track',
          onClick: () =>
            void navigate({
              to: '/studio/sounds/$id',
              params: { id: firstItem.soundId },
            }),
        },
      });
    } else {
      toast.error(completionMessage, { id: notificationId });
    }
  };

  const importTracksAsCollection = async (
    name: string,
    description: string,
    tracks: HearthisTrack[],
    coverUrl?: string | null,
  ) => {
    const pendingTracks = tracks.filter((track) => !importedIds.has(track.id));
    if (pendingTracks.length === 0) {
      setMsg('Already imported — no duplicate collection was created.');
      toast.info('These hearthis.at items are already in your library.');
      return;
    }
    setBusy(true);
    const notificationId = toast.loading(`Import started for “${name}”…`);
    const created = await createStudioCollection({
      name,
      description,
      style: 'PLAYLIST',
      isPublic: true,
    });
    if (!created.ok || !created.data.id) {
      setBusy(false);
      setMsg(
        created.ok ? 'Created collection has no import ID.' : created.error,
      );
      toast.error('Could not create the destination collection.', {
        id: notificationId,
      });
      return;
    }
    const result = await hearthisSourceAdapter.importTracks(
      created.data.id,
      pendingTracks,
    );
    if (coverUrl) {
      await patchStudioCollection(created.data.slug, { coverUrl });
    }
    setBusy(false);
    const nextImportedIds = new Set(importedIds);
    result.items.forEach((item) => nextImportedIds.add(item.trackId));
    setImportedIds(nextImportedIds);
    persistImportedIds(nextImportedIds);
    const completionMessage =
      result.failed > 0
        ? `Created “${name}” with ${result.imported} items; ${result.failed} failed.`
        : result.artworkFailed > 0
          ? `Created “${name}” with ${result.imported} items; ${result.artworkFailed} cover${result.artworkFailed === 1 ? '' : 's'} could not be stored.`
          : `Import completed — created “${name}” with ${result.imported} item${result.imported === 1 ? '' : 's'}.`;
    setMsg(completionMessage);
    toast.success(completionMessage, {
      id: notificationId,
      action: {
        label: 'Open collection',
        onClick: () =>
          void navigate({
            to: '/studio/collections/$slug',
            params: { slug: created.data.slug },
          }),
      },
    });
    const collectionsResult = await fetchStudioCollections();
    setDestinationCollections(collectionsResult.data);
  };

  const importCollection = async (
    collection: NonNullable<HearthisLibrary>['collections'][number],
  ) => {
    setBusy(true);
    try {
      const tracks = await hearthisSourceAdapter.collectionTracks(
        collection.permalink,
      );
      await importTracksAsCollection(
        collection.title,
        collection.description,
        tracks,
        collection.coverUrl,
      );
    } catch (error) {
      setBusy(false);
      setMsg(
        error instanceof Error ? error.message : 'Collection import failed.',
      );
    }
  };

  const importSelection = async () => {
    if (tab === 'collections') {
      const collections = (library?.collections ?? []).filter((c) =>
        selected.has(c.id),
      );
      for (const collection of collections) {
        await importCollection(collection);
      }
      setSelected(new Set());
      return;
    }
    const tracks = visibleTracks.filter((track) => selected.has(track.id));
    await importTracksToDestination(tracks);
  };

  return (
    <ConfigurableCard
      title={plugin.name}
      dialogClassName="max-w-3xl"
      header={(open) => (
        <PluginStoreItem
          icon={<SourceServiceIcon id="hearthis" />}
          name={plugin.name}
          author={plugin.author}
          description={plugin.description}
          isInstalled={Boolean(handle)}
          onInstall={open}
          labels={{ install: 'Configure', installed: 'Configured' }}
        />
      )}
    >
      <div className="border-border bg-background-secondary/40 flex flex-wrap items-center gap-2 rounded-lg border p-3">
        {handle ? (
          <span className="text-sm">
            Connected as <span className="font-medium">@{handle}</span>
          </span>
        ) : (
          <span className="text-foreground-secondary text-sm">
            Add your hearthis.at username to load your library.
          </span>
        )}
        <Input
          className="min-w-0 flex-1 basis-40"
          size="sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={handle ? 'Change username…' : 'hearthis.at username'}
          aria-label="hearthis.at username"
        />
        <Button size="sm" disabled={saving || !draft.trim()} onClick={save}>
          {saving ? 'Saving…' : handle ? 'Update' : 'Connect'}
        </Button>
      </div>
      {msg && (
        <p className="text-foreground-secondary text-xs" role="status">
          {msg}
        </p>
      )}

      {handle && (
        <>
          <Tabs.Root
            selectedIndex={Math.max(
              0,
              (['tracks', 'sets', 'collections', 'search'] as const).indexOf(
                tab,
              ),
            )}
            onChange={(index) => {
              const next = (
                ['tracks', 'sets', 'collections', 'search'] as const
              )[index];
              if (!next) {
                return;
              }
              setTab(next);
              setSelected(new Set());
            }}
          >
            <Tabs.List aria-label="hearthis.at library" className="flex-wrap">
              <Tabs.Tab>
                <TabLabel
                  icon={<CheckSquareIcon size={14} />}
                  count={library?.tracks.length ?? 0}
                >
                  Tracks
                </TabLabel>
              </Tabs.Tab>
              <Tabs.Tab>
                <TabLabel
                  icon={<CheckSquareIcon size={14} />}
                  count={library?.sets.length ?? 0}
                >
                  DJ sets
                </TabLabel>
              </Tabs.Tab>
              <Tabs.Tab>
                <TabLabel
                  icon={<FolderDownIcon size={14} />}
                  count={library?.collections.length ?? 0}
                >
                  Collections
                </TabLabel>
              </Tabs.Tab>
              <Tabs.Tab>
                <TabLabel icon={<SearchIcon size={14} />} count={hits.length}>
                  Search
                </TabLabel>
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.Root>

          {tab === 'search' && (
            <div className="flex flex-wrap gap-2">
              <Input
                className="min-w-0 flex-1 basis-40"
                size="sm"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search hearthis.at"
              />
              <Button
                size="sm"
                disabled={!q.trim() || libraryBusy}
                onClick={() => {
                  setLibraryBusy(true);
                  void hearthisSourceAdapter.search(q.trim()).then((result) => {
                    setLibraryBusy(false);
                    setHits(result.data);
                  });
                }}
              >
                <SearchIcon size={16} aria-hidden className="mr-1.5" />
                {libraryBusy ? 'Searching…' : 'Search'}
              </Button>
            </div>
          )}

          {tab !== 'collections' && (
            <div className="border-border bg-background-secondary/40 flex flex-wrap items-center gap-2 rounded-lg border p-3">
              <Select
                className="min-w-0 flex-1 basis-40"
                options={[
                  { id: '', label: 'Choose destination playlist' },
                  { id: NEW_PLAYLIST_DESTINATION, label: 'New playlist…' },
                  ...playlistDestinations.map((c) => ({
                    id: c.id ?? c.slug,
                    label: c.name,
                  })),
                ]}
                value={destinationId}
                onValueChange={setDestinationId}
              />
              {destinationId === NEW_PLAYLIST_DESTINATION ? (
                <Input
                  size="sm"
                  value={newDestinationName}
                  onChange={(e) => setNewDestinationName(e.target.value)}
                  aria-label="New playlist name"
                  placeholder="Playlist name"
                  className="min-w-0 flex-1 basis-40"
                />
              ) : null}
              <Button
                size="sm"
                variant="secondary"
                disabled={visibleTracks.length === 0}
                onClick={() =>
                  setSelected(
                    new Set(
                      visibleTracks
                        .filter((track) => !importedIds.has(track.id))
                        .map((track) => track.id),
                    ),
                  )
                }
              >
                <CheckSquareIcon size={15} className="mr-1.5" aria-hidden />
                Select all
              </Button>
              <Button
                size="sm"
                disabled={
                  busy ||
                  !destinationId ||
                  (destinationId === NEW_PLAYLIST_DESTINATION &&
                    !newDestinationName.trim()) ||
                  selected.size === 0
                }
                onClick={() => void importSelection()}
              >
                <DownloadIcon size={15} className="mr-1.5" aria-hidden />
                Import selected ({selected.size})
              </Button>
            </div>
          )}

          {tab === 'collections' ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {(library?.collections ?? []).map((collection) => (
                <li
                  key={collection.id}
                  className="border-border flex items-center gap-3 rounded-lg border p-3"
                >
                  <Toggle
                    label={`Select ${collection.title}`}
                    checked={selected.has(collection.id)}
                    onChange={() => toggleSelected(collection.id)}
                  />
                  <MediaArtwork
                    size="thumb"
                    src={collection.coverUrl}
                    alt={collection.title}
                    imageReveal={false}
                    className="border-border shrink-0 rounded border"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {collection.title}
                    </p>
                    <p className="text-foreground-secondary text-xs">
                      {collection.trackCount} items
                    </p>
                  </div>
                  <Tooltip content="Import as collection" side="top">
                    <Button
                      size="icon-sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void importCollection(collection)}
                      aria-label={`Import ${collection.title} as collection`}
                    >
                      <FolderDownIcon size={15} />
                    </Button>
                  </Tooltip>
                </li>
              ))}
              {(library?.collections.length ?? 0) > 0 && (
                <li className="flex flex-wrap justify-end gap-2 sm:col-span-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setSelected(
                        new Set(library?.collections.map((c) => c.id)),
                      )
                    }
                  >
                    <CheckSquareIcon size={15} className="mr-1.5" aria-hidden />
                    Select all
                  </Button>
                  <Button
                    size="sm"
                    disabled={busy || selected.size === 0}
                    onClick={() => void importSelection()}
                  >
                    <FolderDownIcon size={15} className="mr-1.5" aria-hidden />
                    Import selected ({selected.size})
                  </Button>
                </li>
              )}
            </ul>
          ) : (
            <ul className="flex flex-col gap-2">
              {visibleTracks.map((track) => (
                <li
                  key={track.id}
                  className="border-border flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2"
                >
                  <Toggle
                    label={`Select ${track.title}`}
                    checked={selected.has(track.id)}
                    disabled={importedIds.has(track.id)}
                    onChange={() => toggleSelected(track.id)}
                  />
                  <MediaArtwork
                    size="thumb"
                    src={track.coverUrl}
                    alt={track.title}
                    imageReveal={false}
                    onPlay={() => play(playableFromHearthis(track))}
                    playLabel="Preview"
                    className="border-border shrink-0 rounded border"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {track.title}
                    </div>
                    <div className="text-foreground-secondary truncate text-xs">
                      {track.username}
                    </div>
                  </div>
                  <Tooltip content="Queue" side="top">
                    <Button
                      size="icon-sm"
                      variant="secondary"
                      aria-label={`Queue ${track.title}`}
                      onClick={() => enqueue(playableFromHearthis(track))}
                    >
                      <ListPlus size={15} aria-hidden />
                    </Button>
                  </Tooltip>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={
                      busy ||
                      !destinationId ||
                      (destinationId === NEW_PLAYLIST_DESTINATION &&
                        !newDestinationName.trim()) ||
                      importedIds.has(track.id)
                    }
                    onClick={() => void importTracksToDestination([track])}
                  >
                    <DownloadIcon size={15} className="mr-1.5" aria-hidden />
                    {importedIds.has(track.id) ? 'Imported' : 'Import'}
                  </Button>
                  <a
                    href={track.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground-secondary shrink-0 text-xs underline-offset-2 hover:underline"
                  >
                    hearthis.at ↗
                  </a>
                </li>
              ))}
            </ul>
          )}

          {!libraryBusy &&
            tab !== 'search' &&
            tab !== 'collections' &&
            visibleTracks.length === 0 && (
              <p className="text-foreground-secondary text-sm">
                No {tab} found for this profile.
              </p>
            )}
        </>
      )}

      <p className="text-foreground-secondary text-xs">
        A hearthis.at Premium account is required to export your own tracks
        there — importing from hearthis.at works on any account.
      </p>
    </ConfigurableCard>
  );
}
