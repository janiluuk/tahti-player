import { Link } from '@tanstack/react-router';
import { AudioLinesIcon, FolderOpenIcon, PlusIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  Button,
  Dialog,
  Input,
  Select,
  Tabs,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  createEditorProject,
  fetchEditorProjects,
  fetchStudioSounds,
} from '../../api/studio';
import type { EditorProjectRow, StudioSound } from '../../api/studio-types';
import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';
import { contentTypeLabel } from '../../content/contentTypes';

export function StudioEditorListView() {
  const [projects, setProjects] = useState<EditorProjectRow[]>([]);
  const [archive, setArchive] = useState<StudioSound[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [soundId, setArchiveItemId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryType, setLibraryType] = useState('ALL');
  const [libraryQuery, setLibraryQuery] = useState('');

  const libraryTypes = useMemo(() => {
    const types = new Set(
      archive
        .map((item) => item.contentType?.trim().toUpperCase())
        .filter((type): type is string => Boolean(type)),
    );
    return ['ALL', ...Array.from(types).sort()];
  }, [archive]);

  const filteredLibrary = useMemo(() => {
    const query = libraryQuery.trim().toLowerCase();
    return archive.filter((item) => {
      const matchesType =
        libraryType === 'ALL' ||
        item.contentType?.toUpperCase() === libraryType;
      const matchesQuery =
        !query ||
        [item.title, item.artistName, item.genre, item.contentType]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query));
      return matchesType && matchesQuery;
    });
  }, [archive, libraryQuery, libraryType]);

  const formatLibraryType = (type: string) =>
    type === 'ALL' ? 'All' : contentTypeLabel(type);

  const reload = () => {
    void Promise.all([fetchEditorProjects(), fetchStudioSounds()]).then(
      ([p, a]) => {
        setProjects(p.data);
        // EMBED_ONLY items (hearthis.at, Mixcloud, Spotify, Bandcamp) have
        // no Tahti-hosted audio file, so there's nothing for the Pro
        // Editor to open or trim — keep them out of "Open from library".
        setArchive(a.data.filter((item) => !item.embedProvider));
        setLoading(false);
      },
    );
  };

  useEffect(() => {
    reload();
  }, []);

  const closeCreate = () => {
    setCreateOpen(false);
    setTitle('');
    setArchiveItemId('');
    setBusy(false);
  };

  const submitCreate = () => {
    if (busy) {
      return;
    }
    setBusy(true);
    void createEditorProject({
      title: title || undefined,
      soundId: soundId || undefined,
    }).then((r) => {
      setBusy(false);
      if (!r.ok) {
        setMessage(r.error);
        return;
      }
      setMessage(`Created ${r.data.title}`);
      closeCreate();
      reload();
    });
  };

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/editor" />
        <ViewShell
          title="Editor"
          subtitle="Trim and process archive tracks. Sessions keep a linked archive when you seed one."
          classes={{ root: 'px-0 pt-0' }}
        >
          {projects.length > 0 && (
            <div className="flex items-center gap-2">
              <Tooltip content="New session" side="top">
                <Button
                  size="icon-sm"
                  onClick={() => {
                    setMessage(null);
                    setCreateOpen(true);
                  }}
                  aria-label="New session"
                >
                  <PlusIcon size={16} aria-hidden />
                </Button>
              </Tooltip>
            </div>
          )}

          {message && (
            <p className="text-foreground-secondary text-xs" role="status">
              {message}
            </p>
          )}

          <Dialog.Root isOpen={createOpen} onClose={closeCreate}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitCreate();
              }}
            >
              <Dialog.Title>
                <span className="inline-flex items-center gap-2">
                  <AudioLinesIcon size={18} aria-hidden />
                  New session
                </span>
              </Dialog.Title>
              <div className="mt-4 flex flex-col gap-3">
                <Input
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled session"
                  autoFocus
                />
                <Select
                  label="Seed from archive (optional)"
                  value={soundId}
                  onValueChange={setArchiveItemId}
                  placeholder="None"
                  options={archive.map((item) => ({
                    id: item.id,
                    label: item.title,
                  }))}
                />
              </div>
              <Dialog.Actions>
                <Dialog.Close>Cancel</Dialog.Close>
                <Button type="submit" disabled={busy}>
                  <PlusIcon size={16} aria-hidden className="mr-1.5" />
                  {busy ? 'Creating…' : 'Create'}
                </Button>
              </Dialog.Actions>
            </form>
          </Dialog.Root>

          <StudioPanel title="Projects">
            {loading ? (
              <PageLoading label="Loading…" />
            ) : projects.length === 0 ? (
              <div className="flex flex-col gap-3 py-4 text-center">
                <p className="text-foreground-secondary text-sm">
                  No editor projects yet.
                </p>
                <div>
                  <Tooltip content="New session" side="top">
                    <Button
                      size="icon-sm"
                      onClick={() => setCreateOpen(true)}
                      aria-label="New session"
                    >
                      <PlusIcon size={16} aria-hidden />
                    </Button>
                  </Tooltip>
                </div>
              </div>
            ) : (
              <ul className="divide-border divide-y">
                {projects.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center gap-2 py-3 text-sm first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{p.title}</p>
                      <p className="text-foreground-secondary text-xs">
                        Updated {new Date(p.updatedAt).toLocaleString()}
                        {p.soundId ? ', linked archive' : ''}
                      </p>
                    </div>
                    <Tooltip content="Open session" side="top">
                      <Link to="/studio/editor/$id" params={{ id: p.id }}>
                        <Button
                          size="icon-sm"
                          variant="secondary"
                          aria-label={`Open ${p.title}`}
                        >
                          <FolderOpenIcon size={16} aria-hidden />
                        </Button>
                      </Link>
                    </Tooltip>
                    {p.soundId && (
                      <Tooltip content="Pro editor" side="top">
                        <Link
                          to="/studio/sounds/$id/editor"
                          params={{ id: p.soundId }}
                        >
                          <Button
                            size="icon-sm"
                            variant="text"
                            aria-label="Pro editor"
                          >
                            <AudioLinesIcon size={16} aria-hidden />
                          </Button>
                        </Link>
                      </Tooltip>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </StudioPanel>

          <StudioPanel
            title="Open from library"
            description="Choose a library item to open in the pro editor."
          >
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setLibraryType('ALL');
                setLibraryQuery('');
                setLibraryOpen(true);
              }}
            >
              <FolderOpenIcon size={16} aria-hidden className="mr-1.5" />
              Open from library
            </Button>
          </StudioPanel>

          <Dialog.Root
            isOpen={libraryOpen}
            onClose={() => setLibraryOpen(false)}
            className="max-w-4xl"
          >
            <Dialog.Title>Open from library</Dialog.Title>
            <Dialog.Description>
              Browse your library by content type, then open an item in the pro
              editor.
            </Dialog.Description>
            <div className="mt-4 grid min-h-[22rem] gap-4 md:grid-cols-[12rem_1fr]">
              <Tabs.Root
                vertical
                selectedIndex={Math.max(0, libraryTypes.indexOf(libraryType))}
                onChange={(index) => {
                  const next = libraryTypes[index];
                  if (next) {
                    setLibraryType(next);
                  }
                }}
                className="min-w-0"
                listClassName="border-border flex-row gap-1 overflow-x-auto border-b pb-2 md:flex-col md:overflow-visible md:border-r md:border-b-0 md:pr-3 md:pb-0"
                tabClassName="shrink-0 justify-start px-3 py-2 text-left data-[selected]:bg-primary data-[selected]:text-primary-foreground"
              >
                <Tabs.List
                  aria-label="Library content types"
                  className="w-auto"
                >
                  {libraryTypes.map((type) => (
                    <Tabs.Tab key={type}>{formatLibraryType(type)}</Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs.Root>
              <div className="flex min-w-0 flex-col gap-3">
                <Input
                  value={libraryQuery}
                  onChange={(event) => setLibraryQuery(event.target.value)}
                  placeholder="Search library…"
                  aria-label="Search library"
                />
                {filteredLibrary.length === 0 ? (
                  <p className="text-foreground-secondary py-8 text-center text-sm">
                    {archive.length === 0
                      ? 'Upload content in Library first.'
                      : 'No library items match this selection.'}
                  </p>
                ) : (
                  <ul className="border-border divide-border max-h-[20rem] divide-y overflow-y-auto rounded-md border">
                    {filteredLibrary.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-3 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.title}
                          </p>
                          <p className="text-foreground-secondary truncate text-xs">
                            {item.artistName || 'Unknown artist'}
                            {item.genre ? ` · ${item.genre}` : ''}
                          </p>
                        </div>
                        <Link
                          to="/studio/sounds/$id/editor"
                          params={{ id: item.id }}
                          onClick={() => setLibraryOpen(false)}
                        >
                          <Button size="sm">
                            <AudioLinesIcon
                              size={14}
                              aria-hidden
                              className="mr-1.5"
                            />
                            Open
                          </Button>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Dialog.Root>
        </ViewShell>
      </div>
    </StudioGate>
  );
}
