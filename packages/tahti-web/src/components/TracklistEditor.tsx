import {
  EqualIcon,
  FileUpIcon,
  ListMusicIcon,
  MapPinPlusIcon,
  PlusIcon,
  RotateCcwIcon,
  Trash2Icon,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FC,
} from 'react';

import {
  Button,
  Input,
  Tabs,
  Textarea,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import { searchMentionUsers, type MentionUser } from '../api/mentions';
import type {
  TracklistEntry,
  TracklistOverlaySettings,
} from '../api/studio-types';
import { parseTracklist, readTracklistFile } from '../lib/tracklistImport';
import { WaveformCanvas } from './WaveformCanvas';

type Props = {
  durationSec: number;
  peaks: number[];
  value: TracklistEntry[];
  overlay: TracklistOverlaySettings;
  onChange: (entries: TracklistEntry[]) => void;
  onOverlayChange: (overlay: TracklistOverlaySettings) => void;
};

const OVERLAY_PRESETS: Array<{
  id: TracklistOverlaySettings['preset'];
  label: string;
  description: string;
}> = [
  {
    id: 'minimal',
    label: 'Minimal pin',
    description: 'Small current-track label.',
  },
  {
    id: 'cards',
    label: 'Now playing card',
    description: 'Artwork-friendly card with artist credit.',
  },
  {
    id: 'ticker',
    label: 'Timeline ticker',
    description: 'Compact scrolling-style track label.',
  },
];

function formatTime(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) {
    return '—';
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')}`;
}

export const TracklistEditor: FC<Props> = ({
  durationSec,
  peaks,
  value,
  overlay,
  onChange,
  onOverlayChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    value[0]?.id ?? null,
  );
  const [playhead, setPlayhead] = useState(0);
  const [newTitle, setNewTitle] = useState('');
  const [pastedList, setPastedList] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [mentionMatches, setMentionMatches] = useState<MentionUser[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const selected = value.find((entry) => entry.id === selectedId);
  const sortedEntries = useMemo(
    () =>
      [...value].sort(
        (left, right) => (left.startSec ?? 0) - (right.startSec ?? 0),
      ),
    [value],
  );

  useEffect(() => {
    if (!mentionQuery.trim()) {
      setMentionMatches([]);
      return;
    }
    let cancelled = false;
    void searchMentionUsers(mentionQuery).then((result) => {
      if (!cancelled) {
        setMentionMatches(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mentionQuery]);

  const updateSelectedArtist = (text: string) => {
    if (!selectedId) {
      return;
    }
    const isMention = text.startsWith('@');
    onChange(
      value.map((entry) =>
        entry.id === selectedId
          ? {
              ...entry,
              artist: text,
              artistUsername: isMention ? entry.artistUsername : null,
            }
          : entry,
      ),
    );
    setMentionQuery(isMention ? text.slice(1) : '');
  };

  const setSelectedMention = (user: MentionUser) => {
    if (!selectedId) {
      return;
    }
    onChange(
      value.map((entry) =>
        entry.id === selectedId
          ? {
              ...entry,
              artist: user.displayName,
              artistUsername: user.username,
            }
          : entry,
      ),
    );
    setMentionQuery('');
    setMentionMatches([]);
  };

  const importFile = async (file: File) => {
    onChange([
      ...value,
      ...parseTracklist(await readTracklistFile(file), file.name),
    ]);
  };

  const distribute = () => {
    if (value.length === 0) {
      return;
    }
    const segment = durationSec / value.length;
    onChange(
      value.map((entry, index) => ({
        ...entry,
        startSec: Math.round(index * segment),
      })),
    );
  };

  const updateSelectedTime = (seconds: number) => {
    setPlayhead(seconds);
    if (selectedId) {
      onChange(
        value.map((entry) =>
          entry.id === selectedId
            ? { ...entry, startSec: Math.round(seconds) }
            : entry,
        ),
      );
    }
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      void importFile(file);
    }
  };

  const tracklist = (
    <ol className="border-border divide-border divide-y rounded-xl border">
      {value.length === 0 ? (
        <li className="text-foreground-secondary p-4 text-sm">
          No tracks added yet.
        </li>
      ) : (
        value.map((entry, index) => (
          <li
            key={entry.id}
            className={`flex items-center gap-2 p-2 ${selectedId === entry.id ? 'bg-primary/10' : ''}`}
          >
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
              onClick={() => {
                setSelectedId(entry.id);
                setPlayhead(entry.startSec ?? 0);
              }}
            >
              <ListMusicIcon size={15} aria-hidden className="shrink-0" />
              <span className="text-foreground-secondary w-5 shrink-0 tabular-nums">
                {index + 1}
              </span>
              <span className="min-w-0 truncate">
                {entry.title}
                {entry.artist ? ` · ${entry.artist}` : ''}
              </span>
            </button>
            <span className="text-foreground-secondary w-12 text-right text-xs tabular-nums">
              {formatTime(entry.startSec)}
            </span>
            <Tooltip content={`Remove ${entry.title}`} side="top">
              <Button
                size="icon-sm"
                variant="text"
                aria-label={`Remove ${entry.title}`}
                onClick={() =>
                  onChange(
                    value.filter((candidate) => candidate.id !== entry.id),
                  )
                }
              >
                <Trash2Icon size={15} aria-hidden />
              </Button>
            </Tooltip>
          </li>
        ))
      )}
    </ol>
  );

  return (
    <div className="flex flex-col gap-4">
      {tracklist}
      <Tabs
        className="flex flex-col gap-4"
        defaultIndex={0}
        items={[
          {
            id: 'pins',
            label: 'Pins',
            icon: <MapPinPlusIcon size={15} />,
            content: (
              <div className="flex flex-col gap-4">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Input
                    label="Add track name"
                    placeholder="Artist — title"
                    value={newTitle}
                    onChange={(event) => setNewTitle(event.target.value)}
                  />
                  <Button
                    className="self-end"
                    size="sm"
                    disabled={!newTitle.trim()}
                    onClick={() => {
                      const entry = {
                        id: `track-${Date.now()}`,
                        title: newTitle.trim(),
                        artist: null,
                        startSec: Math.round(playhead),
                      };
                      onChange([...value, entry]);
                      setSelectedId(entry.id);
                      setNewTitle('');
                    }}
                  >
                    <PlusIcon size={16} aria-hidden className="mr-1.5" /> Add
                    pin
                  </Button>
                </div>

                <div className="border-border relative rounded-xl border p-2">
                  <WaveformCanvas
                    peaks={peaks}
                    durationSec={Math.max(1, durationSec)}
                    currentTime={playhead}
                    cuts={[]}
                    selection={null}
                    onSeek={updateSelectedTime}
                  />
                  <div className="pointer-events-none absolute inset-x-2 top-2 h-56">
                    {sortedEntries.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        className="border-background bg-primary text-primary-foreground pointer-events-auto absolute top-1 -translate-x-1/2 rounded-full border-2 p-1 shadow"
                        style={{
                          left: `${Math.min(100, Math.max(0, ((entry.startSec ?? 0) / Math.max(1, durationSec)) * 100))}%`,
                        }}
                        aria-label={`Place ${entry.title} at ${formatTime(entry.startSec)}`}
                        title={`${entry.title} · ${formatTime(entry.startSec)}`}
                        onClick={() => {
                          setSelectedId(entry.id);
                          setPlayhead(entry.startSec ?? 0);
                        }}
                      >
                        <MapPinPlusIcon size={13} aria-hidden />
                      </button>
                    ))}
                  </div>
                </div>

                {selected ? (
                  <div className="border-border bg-background-secondary/30 relative rounded-xl border p-3">
                    <Input
                      label={`Artist for “${selected.title}”`}
                      placeholder="Artist name, or @username to tag a Tahti artist"
                      value={selected.artist ?? ''}
                      onChange={(event) =>
                        updateSelectedArtist(event.target.value)
                      }
                    />
                    {mentionMatches.length > 0 ? (
                      <ul
                        className="border-border bg-background absolute right-3 left-3 z-10 mt-1 overflow-hidden rounded-md border shadow-lg"
                        role="listbox"
                        aria-label="Tracklist tag suggestions"
                      >
                        {mentionMatches.map((user) => (
                          <li key={user.username}>
                            <button
                              type="button"
                              className="hover:bg-background-secondary flex w-full gap-2 px-3 py-2 text-left text-sm"
                              onClick={() => setSelectedMention(user)}
                            >
                              <span>{user.displayName}</span>
                              <span className="text-foreground-secondary">
                                @{user.username}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {selected.artistUsername ? (
                      <p className="text-foreground-secondary mt-1 text-xs">
                        Tagged @{selected.artistUsername} — they&apos;ll get a
                        notification and a link to this track once the tracklist
                        is saved.
                      </p>
                    ) : (
                      <p className="text-foreground-secondary mt-1 text-xs">
                        Type @ to search and tag a Tahti artist.
                      </p>
                    )}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!value.length}
                    onClick={distribute}
                  >
                    <EqualIcon size={16} aria-hidden className="mr-1.5" />{' '}
                    Divide equally
                  </Button>
                  <Button
                    size="sm"
                    variant="text"
                    disabled={!selected}
                    onClick={() => updateSelectedTime(playhead)}
                  >
                    <MapPinPlusIcon size={16} aria-hidden className="mr-1.5" />{' '}
                    Place selected at {formatTime(playhead)}
                  </Button>
                  <Button
                    size="sm"
                    variant="text"
                    disabled={!value.length}
                    onClick={() =>
                      onChange(
                        value.map((entry) => ({ ...entry, startSec: null })),
                      )
                    }
                  >
                    <RotateCcwIcon size={16} aria-hidden className="mr-1.5" />{' '}
                    Clear timestamps
                  </Button>
                </div>
              </div>
            ),
          },
          {
            id: 'import',
            label: 'Import',
            icon: <FileUpIcon size={15} />,
            content: (
              <Tabs
                className="flex flex-col gap-4"
                defaultIndex={0}
                items={[
                  {
                    id: 'import-file',
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <FileUpIcon size={15} aria-hidden />
                        File
                      </span>
                    ),
                    content: (
                      <div className="flex flex-col gap-4">
                        <p className="text-foreground-secondary text-sm">
                          Import a Traktor playlist or history (
                          <code>.nml</code>), a Rekordbox playlist or history
                          export (<code>.txt</code>), or a plain-text tracklist
                          file. Traktor history keeps each track&apos;s real
                          play time; Rekordbox exports and plain text use a
                          timestamp anywhere on the line — leading (
                          <code>12:14 Artist – Track</code>), trailing (
                          <code>Artist – Track – 12:14</code>), or (for
                          Rekordbox) the track&apos;s length, summed in file
                          order.
                        </p>
                        <div
                          className={`border-border rounded-xl border border-dashed p-4 transition-colors ${dragActive ? 'border-primary bg-primary/10' : 'bg-background-secondary/30'}`}
                          onDragEnter={(event) => {
                            event.preventDefault();
                            setDragActive(true);
                          }}
                          onDragOver={(event) => event.preventDefault()}
                          onDragLeave={() => setDragActive(false)}
                          onDrop={onDrop}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm">
                              <FileUpIcon size={18} aria-hidden />
                              <span>
                                {dragActive
                                  ? 'Drop Traktor or Rekordbox playlist here'
                                  : 'Drop .nml or .txt tracklist here'}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <FileUpIcon
                                size={16}
                                aria-hidden
                                className="mr-1.5"
                              />{' '}
                              Import list
                            </Button>
                            <input
                              ref={fileInputRef}
                              className="hidden"
                              type="file"
                              accept=".nml,.txt,text/plain,application/xml"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) {
                                  void importFile(file);
                                }
                                event.currentTarget.value = '';
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: 'import-paste',
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <ListMusicIcon size={15} aria-hidden />
                        Paste text
                      </span>
                    ),
                    content: (
                      <div className="flex flex-col gap-4">
                        <p className="text-foreground-secondary text-sm">
                          Paste one track per line. A timestamp anywhere on the
                          line — leading (<code>12:14 Artist – Track</code>),
                          trailing (<code>Artist – Track – 12:14</code>),
                          minutes:seconds or hours:minutes:seconds — is picked
                          up automatically.
                        </p>
                        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                          <label className="flex flex-col gap-1 text-sm">
                            Paste one track per line
                            <Textarea
                              rows={5}
                              placeholder="12:14 Artist – Track\nArtist – Next track – 18:02"
                              value={pastedList}
                              onChange={(event) =>
                                setPastedList(event.target.value)
                              }
                            />
                          </label>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={!pastedList.trim()}
                            onClick={() => {
                              onChange([
                                ...value,
                                ...parseTracklist(pastedList, 'tracklist.txt'),
                              ]);
                              setPastedList('');
                            }}
                          >
                            <ListMusicIcon
                              size={16}
                              aria-hidden
                              className="mr-1.5"
                            />{' '}
                            Add lines
                          </Button>
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            ),
          },
          {
            id: 'overlay',
            label: 'Overlay',
            icon: <ListMusicIcon size={15} />,
            content: (
              <div className="flex flex-col gap-5">
                <div className="border-border bg-background-secondary/30 flex items-center justify-between gap-4 rounded-xl border p-4">
                  <div>
                    <p className="font-medium">Tracklist overlay</p>
                    <p className="text-foreground-secondary text-sm">
                      Show the current track&apos;s title (and artist, if
                      tagged) over the player while this set plays.
                    </p>
                  </div>
                  <Toggle
                    label="Show tracklist overlay on the current track"
                    checked={overlay.enabled}
                    onChange={(enabled) =>
                      onOverlayChange({ ...overlay, enabled })
                    }
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
                    Style
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {OVERLAY_PRESETS.map((preset) => {
                      const active = overlay.preset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          aria-pressed={active}
                          disabled={!overlay.enabled}
                          onClick={() =>
                            onOverlayChange({ ...overlay, preset: preset.id })
                          }
                          className={`flex flex-col gap-1 rounded-xl border p-3 text-left transition-colors disabled:opacity-40 ${
                            active
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:bg-background-secondary/40'
                          }`}
                        >
                          <span
                            className={`text-sm font-semibold ${active ? 'text-primary' : ''}`}
                          >
                            {preset.label}
                          </span>
                          <span className="text-foreground-secondary text-xs">
                            {preset.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};
