import { Link } from '@tanstack/react-router';
import {
  Disc3Icon,
  DiscAlbumIcon,
  HeadphonesIcon,
  LibraryIcon,
  ListMusicIcon,
  Mic2Icon,
  PlusIcon,
  RadioTowerIcon,
  SearchIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  Button,
  Dialog,
  EmptyState,
  ImageReveal,
  Input,
  Select,
  TabLabel,
  Tabs,
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
import {
  collectionStyleLabel,
  normalizeCollectionStyle,
} from '../../content/collectionStyles';

/** Styles this quick-create dialog and the filter tabs offer — a subset of
 * CollectionStyleId (no SINGLE; those come from linking a release, not from
 * a blank "new collection" flow). Icons are kept local since the shared
 * content/ modules stay JSX-free. */
const CREATE_STYLE_ICONS = {
  ALBUM: <Disc3Icon size={18} aria-hidden />,
  EP: <DiscAlbumIcon size={18} aria-hidden />,
  PLAYLIST: <ListMusicIcon size={18} aria-hidden />,
  DJ_SET_SERIES: <HeadphonesIcon size={18} aria-hidden />,
  PODCAST: <Mic2Icon size={18} aria-hidden />,
  SERIES: <RadioTowerIcon size={18} aria-hidden />,
} as const;

type CreateStyle = keyof typeof CREATE_STYLE_ICONS;
type CollectionFilter = 'ALL' | CreateStyle;

const CREATE_STYLES = (Object.keys(CREATE_STYLE_ICONS) as CreateStyle[]).map(
  (id) => ({
    id,
    label: collectionStyleLabel(id),
    icon: CREATE_STYLE_ICONS[id],
  }),
);

const collectionStyle = (collection: StudioCollection): CreateStyle => {
  const normalized = normalizeCollectionStyle(
    collection.style ?? collection.type,
  );
  // This view's tabs and quick-create dialog don't have a dedicated
  // Single bucket — group singles under Album, same as before.
  return normalized === 'SINGLE' ? 'ALBUM' : normalized;
};

export function StudioCollectionsView() {
  const [rows, setRows] = useState<StudioCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [style, setStyle] = useState<CreateStyle>('ALBUM');
  const [filter, setFilter] = useState<CollectionFilter>('ALL');
  const [query, setQuery] = useState('');
  const [visibility, setVisibility] = useState<
    'PUBLIC' | 'UNLISTED' | 'PRIVATE'
  >('PUBLIC');
  const [releaseDate, setReleaseDate] = useState('');
  const [genres, setGenres] = useState('');
  const [collaborative, setCollaborative] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    void fetchStudioCollections().then((res) => {
      setRows(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    reload();
  }, []);

  const closeCreate = () => {
    setCreateOpen(false);
    setName('');
    setStyle('ALBUM');
    setVisibility('PUBLIC');
    setReleaseDate('');
    setGenres('');
    setCollaborative(false);
    setBusy(false);
  };

  const submitCreate = () => {
    if (!name.trim() || busy) {
      return;
    }
    setBusy(true);
    setMsg(null);
    void createStudioCollection({
      name: name.trim(),
      style,
      isPublic: visibility === 'PUBLIC',
      visibility,
      releaseDate: releaseDate || null,
      genres: genres
        .split(',')
        .map((genre) => genre.trim())
        .filter(Boolean)
        .slice(0, 5),
      collaborative:
        style === 'PLAYLIST' && visibility === 'PUBLIC' && collaborative,
    }).then((r) => {
      setBusy(false);
      if (!r.ok) {
        setMsg(r.error);
        return;
      }
      setMsg(`Created ${r.data.name} — open designer to add tracks.`);
      closeCreate();
      reload();
    });
  };

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows.filter(
      (collection) =>
        (filter === 'ALL' || collectionStyle(collection) === filter) &&
        (!normalizedQuery ||
          collection.name.toLowerCase().includes(normalizedQuery) ||
          collection.description?.toLowerCase().includes(normalizedQuery)),
    );
  }, [filter, query, rows]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        CREATE_STYLES.map((option) => [
          option.id,
          rows.filter((collection) => collectionStyle(collection) === option.id)
            .length,
        ]),
      ) as Record<CreateStyle, number>,
    [rows],
  );

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/collections" />
        <ViewShell
          title="Collections"
          subtitle="Albums, EPs, DJ sets, and playlists."
          classes={{ root: 'px-0 pt-0' }}
        >
          <div className="mb-4">
            <Tooltip content="New collection" side="top">
              <Button
                size="icon-sm"
                onClick={() => {
                  setMsg(null);
                  setCreateOpen(true);
                }}
                aria-label="New collection"
              >
                <PlusIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
          </div>

          {msg && <p className="mb-4 text-sm">{msg}</p>}

          <Dialog.Root isOpen={createOpen} onClose={closeCreate}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitCreate();
              }}
            >
              <Dialog.Title>
                <span className="inline-flex items-center gap-2">
                  <PlusIcon size={18} aria-hidden />
                  New collection
                </span>
              </Dialog.Title>
              <Dialog.Description>
                Choose a type and give it a title.
              </Dialog.Description>
              <div className="mt-4 flex flex-col gap-3">
                <Input
                  label="Title"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
                <div className="flex flex-wrap gap-2">
                  {CREATE_STYLES.map((s) => (
                    <StyleChip
                      key={s.id}
                      selected={style === s.id}
                      icon={s.icon}
                      label={s.label}
                      onClick={() => setStyle(s.id)}
                    />
                  ))}
                </div>
                {style === 'ALBUM' || style === 'EP' ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      type="date"
                      label="Release date"
                      value={releaseDate}
                      onChange={(event) => setReleaseDate(event.target.value)}
                    />
                    <Input
                      label="Genres"
                      value={genres}
                      placeholder="Electronic, Ambient"
                      onChange={(event) => setGenres(event.target.value)}
                    />
                  </div>
                ) : null}
                <Select
                  label="Visibility"
                  value={visibility}
                  onValueChange={(value) => {
                    const nextVisibility = value as
                      | 'PUBLIC'
                      | 'UNLISTED'
                      | 'PRIVATE';
                    setVisibility(nextVisibility);
                    if (nextVisibility !== 'PUBLIC') {
                      setCollaborative(false);
                    }
                  }}
                  options={[
                    { id: 'PUBLIC', label: 'Public' },
                    { id: 'UNLISTED', label: 'Unlisted — direct link only' },
                    { id: 'PRIVATE', label: 'Private — only you' },
                  ]}
                />
                {style === 'PLAYLIST' ? (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span>Others can add tracks</span>
                    <Toggle
                      label="Others can add tracks"
                      checked={collaborative}
                      disabled={visibility !== 'PUBLIC'}
                      onChange={setCollaborative}
                    />
                  </div>
                ) : null}
              </div>
              <Dialog.Actions>
                <Dialog.Close>Cancel</Dialog.Close>
                <Button type="submit" disabled={!name.trim() || busy}>
                  <PlusIcon size={16} aria-hidden className="mr-1.5" />
                  {busy ? 'Creating…' : 'Create'}
                </Button>
              </Dialog.Actions>
            </form>
          </Dialog.Root>

          <StudioPanel>
            <div className="mb-4 flex flex-col gap-3">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search collections…"
                aria-label="Search collections"
                startAddon={
                  <SearchIcon size={14} aria-hidden className="opacity-70" />
                }
              />
              <Tabs.Root
                selectedIndex={
                  filter === 'ALL'
                    ? 0
                    : CREATE_STYLES.findIndex(
                        (option) => option.id === filter,
                      ) + 1
                }
                onChange={(index) => {
                  if (index === 0) {
                    setFilter('ALL');
                    return;
                  }
                  const option = CREATE_STYLES[index - 1];
                  if (option) {
                    setFilter(option.id);
                  }
                }}
              >
                <Tabs.List aria-label="Collection types" className="flex-wrap">
                  <Tabs.Tab>
                    <TabLabel
                      icon={<LibraryIcon size={16} />}
                      count={rows.length}
                    >
                      All
                    </TabLabel>
                  </Tabs.Tab>
                  {CREATE_STYLES.map((option) => (
                    <Tabs.Tab key={option.id}>
                      <TabLabel icon={option.icon} count={counts[option.id]}>
                        {option.label.endsWith('s')
                          ? option.label
                          : `${option.label}s`}
                      </TabLabel>
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs.Root>
            </div>
            {loading ? (
              <PageLoading label="Loading…" />
            ) : rows.length === 0 ? (
              <EmptyState
                size="sm"
                title="No collections yet"
                description="Create an album, EP, DJ set, podcast, or playlist."
                action={
                  <Tooltip content="New collection" side="top">
                    <Button
                      size="icon-sm"
                      onClick={() => setCreateOpen(true)}
                      aria-label="New collection"
                    >
                      <PlusIcon size={16} aria-hidden />
                    </Button>
                  </Tooltip>
                }
              />
            ) : filteredRows.length === 0 ? (
              <EmptyState
                size="sm"
                title="No collections match these filters."
              />
            ) : (
              <ul className="divide-border divide-y">
                {filteredRows.map((c) => (
                  <li
                    key={c.slug}
                    className="flex items-center gap-3 py-3 text-sm first:pt-0 last:pb-0"
                  >
                    <ImageReveal
                      src={c.coverUrl ?? undefined}
                      alt=""
                      className="border-border bg-background h-12 w-12 rounded-lg border shadow-sm"
                      placeholder={
                        <Disc3Icon size={18} className="opacity-40" />
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
                      <p className="text-foreground-secondary text-xs">
                        /{c.slug}
                        {`, ${collectionStyleLabel(collectionStyle(c))}`}
                        {c.releaseDate ? `, releases ${c.releaseDate}` : ''}
                        {c.genres?.length ? `, ${c.genres.join(', ')}` : ''}
                        {typeof c.itemCount === 'number'
                          ? `, ${c.itemCount} items`
                          : c.items
                            ? `, ${c.items.length} items`
                            : ''}
                        {`, ${(c.visibility ?? (c.isPublic === false ? 'PRIVATE' : 'PUBLIC')).toLowerCase()}`}
                      </p>
                    </div>
                    <Link
                      to="/studio/collections/$slug"
                      params={{ slug: c.slug }}
                    >
                      <Button size="sm">
                        {['ALBUM', 'EP'].includes(collectionStyle(c))
                          ? 'Design'
                          : 'Edit'}
                      </Button>
                    </Link>
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

function StyleChip({
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
    <Button
      type="button"
      variant="text"
      size="flexible"
      className={`gap-1.5 rounded-md border px-2.5 py-1.5 text-xs ${
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
    </Button>
  );
}
