import { Link } from '@tanstack/react-router';
import {
  Code2Icon,
  Disc3Icon,
  DiscAlbumIcon,
  ExternalLinkIcon,
  LibraryIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Share2Icon,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { Button, Dialog, Input } from '@nuclearplayer/ui';

import { createStudioRelease, fetchStudioReleases } from '../../api/studio';
import type { StudioRelease } from '../../api/studio-types';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPageHeader, StudioPanel } from '../../components/StudioPanel';

const RELEASE_TYPES = [
  {
    id: 'SINGLE',
    label: 'Single',
    icon: <DiscAlbumIcon size={18} aria-hidden />,
  },
  { id: 'EP', label: 'EP', icon: <DiscAlbumIcon size={18} aria-hidden /> },
  { id: 'ALBUM', label: 'Album', icon: <Disc3Icon size={18} aria-hidden /> },
  {
    id: 'COMPILATION',
    label: 'Compilation',
    icon: <LibraryIcon size={18} aria-hidden />,
  },
] as const;

export function StudioReleasesView({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [releases, setReleases] = useState<StudioRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [openMoreId, setOpenMoreId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('SINGLE');
  const [releaseDate, setReleaseDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const reload = () => {
    void fetchStudioReleases().then((res) => {
      setReleases(res.data.releases);
      setLoading(false);
    });
  };

  useEffect(() => {
    reload();
  }, []);

  const closeCreate = () => {
    setCreateOpen(false);
    setTitle('');
    setType('SINGLE');
    setReleaseDate(new Date().toISOString().slice(0, 10));
    setCreating(false);
  };

  const create = async () => {
    setCreating(true);
    setMsg(null);
    const r = await createStudioRelease({
      title: title.trim(),
      type,
      releaseDate,
    });
    setCreating(false);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setMsg(`Created ${r.data.title}.`);
    closeCreate();
    reload();
  };

  return (
    <StudioGate>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        {!embedded ? <StudioNav current="/studio/releases" /> : null}
        <StudioPageHeader
          title="Releases"
          subtitle="Package tracks into singles, EPs, and albums for your public link."
          action={
            <div className="flex flex-wrap gap-2">
              <Link
                to="/studio/embeds"
                aria-label="Manage embeds"
                title="Manage embeds"
              >
                <Button size="sm" variant="secondary">
                  <Code2Icon size={16} aria-hidden className="mr-1.5" />
                  Embeds
                </Button>
              </Link>
              <Button
                size="sm"
                onClick={() => {
                  setMsg(null);
                  setCreateOpen(true);
                }}
                aria-label="New release"
                title="New release"
              >
                <PlusIcon size={16} aria-hidden className="mr-1.5" />
                New
              </Button>
            </div>
          }
        />

        {msg && <p className="text-foreground-secondary text-sm">{msg}</p>}

        <Dialog.Root isOpen={createOpen} onClose={closeCreate}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void create();
            }}
          >
            <Dialog.Title>
              <span className="inline-flex items-center gap-2">
                <PlusIcon size={18} aria-hidden />
                New release
              </span>
            </Dialog.Title>
            <div className="mt-4 flex flex-col gap-3">
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                {RELEASE_TYPES.map((t) => (
                  <TypeChip
                    key={t.id}
                    selected={type === t.id}
                    icon={t.icon}
                    label={t.label}
                    onClick={() => setType(t.id)}
                  />
                ))}
              </div>
              <label className="text-foreground-secondary text-xs uppercase">
                Release date
                <input
                  type="date"
                  className="border-border bg-background text-foreground mt-1 w-full rounded border px-2 py-1.5 text-sm normal-case"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                />
              </label>
            </div>
            <Dialog.Actions>
              <Dialog.Close>Cancel</Dialog.Close>
              <Button
                type="submit"
                disabled={creating || !title.trim() || !releaseDate}
              >
                <PlusIcon size={16} aria-hidden className="mr-1.5" />
                {creating ? 'Creating…' : 'Create'}
              </Button>
            </Dialog.Actions>
          </form>
        </Dialog.Root>

        <StudioPanel>
          {loading ? (
            <p className="text-foreground-secondary text-sm">Loading…</p>
          ) : releases.length === 0 ? (
            <div className="flex flex-col gap-3 py-4 text-center">
              <p className="text-foreground-secondary text-sm">
                No releases yet. Create one to share a public link.
              </p>
              <div>
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <PlusIcon size={16} aria-hidden className="mr-1.5" />
                  New release
                </Button>
              </div>
            </div>
          ) : (
            <ul className="divide-border divide-y">
              {releases.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center gap-2 py-3 text-sm first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/studio/releases/$id"
                      params={{ id: r.id }}
                      className="font-medium hover:underline"
                    >
                      {r.title}
                    </Link>
                    <p className="text-foreground-secondary text-xs">
                      {r.type}, {r.state}
                      {typeof r._count?.tracks === 'number'
                        ? `, ${r._count.tracks} tracks`
                        : ''}
                    </p>
                  </div>
                  <Link to="/studio/releases/$id" params={{ id: r.id }}>
                    <Button size="sm" variant="secondary">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={openMoreId === r.id ? 'Less' : 'More'}
                    title={openMoreId === r.id ? 'Less' : 'More'}
                    onClick={() =>
                      setOpenMoreId((id) => (id === r.id ? null : r.id))
                    }
                  >
                    <MoreHorizontalIcon size={16} aria-hidden />
                  </Button>
                  {openMoreId === r.id && (
                    <div className="flex w-full flex-wrap gap-2 pt-1">
                      <Link to="/r/$slug" params={{ slug: r.smartLinkSlug }}>
                        <Button
                          size="icon-sm"
                          variant="text"
                          aria-label="Public link"
                          title="Public link"
                        >
                          <ExternalLinkIcon size={16} aria-hidden />
                        </Button>
                      </Link>
                      <Link to="/studio/distribution">
                        <Button
                          size="icon-sm"
                          variant="text"
                          aria-label="Distribution"
                          title="Distribution"
                        >
                          <Share2Icon size={16} aria-hidden />
                        </Button>
                      </Link>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </StudioPanel>
      </div>
    </StudioGate>
  );
}

function TypeChip({
  selected,
  icon,
  label,
  onClick,
}: {
  selected: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs ${
        selected
          ? 'border-primary bg-primary/15 text-primary'
          : 'border-border text-foreground-secondary'
      }`}
      onClick={onClick}
      aria-pressed={selected}
      title={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
