import { ArrowDownIcon, ArrowUpIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';

import { Button, Input, SaveButton, Select, Toggle } from '@tahti-player/ui';

import {
  addAdminReleaseTrackToRotation,
  fetchAdminChannelProgramme,
  saveAdminChannelProgramme,
  type AdminProgrammeSettings,
} from '../../../api/admin';
import type {
  ProgrammeItem,
  ProgrammeLibraryTrack,
  ProgrammeView,
} from '../../../api/studio-extras/schedule';
import { StudioPanel } from '../../../components/StudioPanel';
import { RotationReleaseLibrary } from './RotationReleaseLibrary';

function formatDuration(sec: number | null): string {
  if (sec == null) {
    return '—';
  }
  const minutes = Math.floor(sec / 60);
  return `${minutes}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
}

export function moveRotationItem(
  items: ProgrammeItem[],
  index: number,
  direction: -1 | 1,
): ProgrammeItem[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) {
    return items;
  }
  const next = [...items];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

function sortedForEditing(items: ProgrammeItem[]): ProgrammeItem[] {
  return [...items].sort((left, right) => {
    if (left.isFallback !== right.isFallback) {
      return left.isFallback ? -1 : 1;
    }
    return (
      (left.fallbackOrder ?? Number.MAX_SAFE_INTEGER) -
      (right.fallbackOrder ?? Number.MAX_SAFE_INTEGER)
    );
  });
}

export function ChannelRotationPanel() {
  const [slugInput, setSlugInput] = useState('');
  const [slug, setSlug] = useState<string | null>(null);
  const [settings, setSettings] = useState<AdminProgrammeSettings | null>(null);
  const [items, setItems] = useState<ProgrammeItem[]>([]);
  const [library, setLibrary] = useState<ProgrammeLibraryTrack[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const apply = ({
    items: next,
    library: nextLibrary,
    ...rest
  }: ProgrammeView) => {
    setSettings(rest);
    setItems(sortedForEditing(next));
    setLibrary(nextLibrary ?? []);
  };

  const addFromRelease = (releaseTrackId: string) => {
    if (!slug) {
      return;
    }
    setAddingId(releaseTrackId);
    setError(null);
    setNotice(null);
    void addAdminReleaseTrackToRotation(slug, releaseTrackId).then((result) => {
      setAddingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      apply(result.data);
      setNotice(`Added to ${slug}'s rotation.`);
    });
  };

  const load = () => {
    const nextSlug = slugInput.trim().toLowerCase();
    setLoading(true);
    setError(null);
    setNotice(null);
    void fetchAdminChannelProgramme(nextSlug).then((result) => {
      setLoading(false);
      if (!result.ok) {
        setSlug(null);
        setSettings(null);
        setError(result.error);
        return;
      }
      setSlug(nextSlug);
      apply(result.data);
    });
  };

  const inRotation = items.filter((item) => item.isFallback).length;

  return (
    <StudioPanel
      title="Channel 24/7 rotation"
      description="What a channel plays while its artist is offline. Changes here act for the artist; they see the same rotation in Studio."
    >
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          load();
        }}
      >
        <Input
          label="Channel slug"
          value={slugInput}
          onChange={(event) => setSlugInput(event.target.value)}
          className="max-w-xs"
        />
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          disabled={loading || !slugInput.trim()}
        >
          <SearchIcon size={14} aria-hidden className="mr-1.5" />
          {loading ? 'Loading…' : 'Open rotation'}
        </Button>
      </form>

      {error ? (
        <p className="text-accent-red-strong mt-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="text-foreground-secondary mt-3 text-sm" role="status">
          {notice}
        </p>
      ) : null}

      {slug && settings ? (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Toggle
              label="Rotation on"
              checked={settings.fallbackEnabled}
              onChange={(checked) =>
                setSettings({ ...settings, fallbackEnabled: checked })
              }
            />
            <Toggle
              label="New uploads join"
              checked={settings.fallbackAutoEnroll}
              onChange={(checked) =>
                setSettings({ ...settings, fallbackAutoEnroll: checked })
              }
            />
            <Toggle
              label="Channel announcements"
              checked={settings.announcementsEnabled}
              onChange={(checked) =>
                setSettings({ ...settings, announcementsEnabled: checked })
              }
            />
            <Select
              label="Order"
              value={settings.fallbackMode}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  fallbackMode: value as AdminProgrammeSettings['fallbackMode'],
                })
              }
              options={[
                { id: 'shuffle', label: 'Shuffle' },
                { id: 'ordered', label: 'In this order' },
              ]}
              className="min-w-36"
            />
          </div>

          <p className="text-foreground-secondary text-xs">
            {inRotation} of {items.length} ready tracks in the rotation.
          </p>

          {items.length === 0 ? (
            <p className="text-foreground-secondary text-sm">
              This channel has no ready tracks.
            </p>
          ) : (
            <ol className="divide-border divide-y">
              {items.map((item, index) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Toggle
                      label={`${item.title} in rotation`}
                      checked={item.isFallback}
                      disabled={Boolean(item.embedProvider)}
                      onChange={(checked) =>
                        setItems(
                          items.map((current) =>
                            current.id === item.id
                              ? { ...current, isFallback: checked }
                              : current,
                          ),
                        )
                      }
                    />
                    <span className="truncate font-medium">{item.title}</span>
                    <span className="text-foreground-secondary text-xs">
                      {formatDuration(item.durationSec)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon-sm"
                      variant="text"
                      aria-label={`Move ${item.title} up`}
                      disabled={index === 0}
                      onClick={() =>
                        setItems(moveRotationItem(items, index, -1))
                      }
                    >
                      <ArrowUpIcon size={14} aria-hidden />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="text"
                      aria-label={`Move ${item.title} down`}
                      disabled={index === items.length - 1}
                      onClick={() =>
                        setItems(moveRotationItem(items, index, 1))
                      }
                    >
                      <ArrowDownIcon size={14} aria-hidden />
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <RotationReleaseLibrary
            tracks={library}
            busyId={addingId}
            onAdd={addFromRelease}
          />

          <div>
            <SaveButton
              size="sm"
              saving={saving}
              label={`Save ${slug}'s rotation`}
              onClick={() => {
                setSaving(true);
                setError(null);
                setNotice(null);
                void saveAdminChannelProgramme(slug, settings, items).then(
                  (result) => {
                    setSaving(false);
                    if (!result.ok) {
                      setError(result.error);
                      return;
                    }
                    apply(result.data);
                    setNotice(`Saved ${slug}'s rotation.`);
                  },
                );
              }}
            />
          </div>
        </div>
      ) : null}
    </StudioPanel>
  );
}
