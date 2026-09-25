import { Link } from '@tanstack/react-router';
import {
  GlobeIcon,
  ListMusicIcon,
  LockIcon,
  PencilIcon,
  PlusIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  ButtonLink,
  Dialog,
  EmptyState,
  Input,
  MediaArtwork,
  Toggle,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  createStudioCollection,
  fetchStudioCollections,
} from '../../api/studio';
import type { StudioCollection } from '../../api/studio-types';
import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';

function isPlaylist(c: StudioCollection) {
  return !c.style || c.style === 'PLAYLIST' || c.style === 'CUSTOM';
}

export function StudioPlaylistsView() {
  const [rows, setRows] = useState<StudioCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [collaborative, setCollaborative] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    void fetchStudioCollections()
      .then((res) => {
        setRows(res.data.filter(isPlaylist));
      })
      .catch(() => toast.error('Could not load your playlists.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const create = async () => {
    if (!name.trim()) {
      return;
    }
    setBusy(true);
    try {
      const r = await createStudioCollection({
        name: name.trim(),
        style: 'PLAYLIST',
        isPublic,
        collaborative: isPublic && collaborative,
      });
      if (!r.ok) {
        setMsg(r.error);
        return;
      }
      setCreateOpen(false);
      setName('');
      reload();
    } catch {
      setMsg('Could not create the playlist.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/playlists" />
        <ViewShell
          title="Playlists"
          classes={{ root: 'px-0 pt-0' }}
          actions={
            <Tooltip content="New playlist" side="top">
              <Button
                size="icon-sm"
                onClick={() => setCreateOpen(true)}
                aria-label="New playlist"
              >
                <PlusIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
          }
        >
          <nav className="flex flex-wrap gap-2" aria-label="Collection views">
            <ButtonLink to="/studio/collections" size="sm" variant="secondary">
              Collections
            </ButtonLink>
            <Button size="sm" variant="default" aria-current="page">
              Playlists
            </Button>
          </nav>

          {msg && (
            <p className="text-foreground-secondary px-1 text-sm">{msg}</p>
          )}

          <Dialog.Root isOpen={createOpen} onClose={() => setCreateOpen(false)}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void create();
              }}
            >
              <Dialog.Title>New playlist</Dialog.Title>
              <div className="mt-4 flex flex-col gap-3">
                <Input
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>Public on profile</span>
                  <Toggle
                    label="Public on profile"
                    checked={isPublic}
                    onChange={(checked) => {
                      setIsPublic(checked);
                      if (!checked) {
                        setCollaborative(false);
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>Others can add tracks</span>
                  <Toggle
                    label="Others can add tracks"
                    checked={collaborative}
                    disabled={!isPublic}
                    onChange={setCollaborative}
                  />
                </div>
              </div>
              <Dialog.Actions>
                <Dialog.Close>Cancel</Dialog.Close>
                <Button type="submit" disabled={busy || !name.trim()}>
                  Create
                </Button>
              </Dialog.Actions>
            </form>
          </Dialog.Root>

          <StudioPanel>
            {loading ? (
              <PageLoading label="Loading…" />
            ) : rows.length === 0 ? (
              <EmptyState
                icon={<ListMusicIcon size={40} className="opacity-40" />}
                title="No playlists yet"
                description="Create a playlist to organize tracks and releases."
                action={
                  <Tooltip content="New playlist" side="top">
                    <Button
                      size="icon-sm"
                      onClick={() => setCreateOpen(true)}
                      aria-label="New playlist"
                    >
                      <PlusIcon size={16} aria-hidden />
                    </Button>
                  </Tooltip>
                }
              />
            ) : (
              <ul className="divide-border divide-y">
                {rows.map((c) => (
                  <li
                    key={c.slug}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <MediaArtwork
                      size="thumb"
                      src={c.coverUrl}
                      alt=""
                      className="border-border bg-background rounded-lg border shadow-sm"
                      placeholder={
                        <ListMusicIcon size={20} className="opacity-40" />
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/studio/collections/$slug"
                        params={{ slug: c.slug }}
                        className="font-medium hover:underline"
                      >
                        {c.name}
                      </Link>
                      <p className="text-foreground-secondary flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1">
                          {c.isPublic === false ? (
                            <LockIcon size={12} aria-hidden />
                          ) : (
                            <GlobeIcon size={12} aria-hidden />
                          )}
                          {c.isPublic === false ? 'Private' : 'Public'}
                        </span>
                        {c.collaborative ? (
                          <span className="inline-flex items-center gap-1">
                            <UsersIcon size={12} aria-hidden />
                            Collaborative
                          </span>
                        ) : null}
                        {typeof c.itemCount === 'number'
                          ? `, ${c.itemCount} items`
                          : c.items
                            ? `, ${c.items.length} items`
                            : ''}
                      </p>
                    </div>
                    <ButtonLink
                      to="/studio/collections/$slug"
                      params={{ slug: c.slug }}
                      size="sm"
                    >
                      <PencilIcon size={14} aria-hidden className="mr-1.5" />
                      Edit
                    </ButtonLink>
                  </li>
                ))}
              </ul>
            )}
          </StudioPanel>
        </ViewShell>
      </div>
    </StudioGate>
  );
}
