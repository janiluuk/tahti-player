import { BarChart3Icon } from 'lucide-react';
import { useState } from 'react';

import { Button, Input, SaveButton, Textarea } from '@tahti-player/ui';

import { patchEpisode, type StudioEpisode } from '../../../api/shows';
import { Eyebrow } from '../../../components/tahti/Eyebrow';
import { episodeStatusLabel } from '../StudioShowsView';

export function EpisodeEditorRow({
  episode,
  onSaved,
}: {
  episode: StudioEpisode;
  onSaved: (episode: StudioEpisode) => void;
}) {
  const [title, setTitle] = useState(episode.title);
  const [description, setDescription] = useState(episode.description);
  const [saving, setSaving] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const result = await patchEpisode(episode.id, {
      title: title.trim() || episode.title,
      description: description.trim(),
    });
    setSaving(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    onSaved(result.data);
    setTitle(result.data.title);
    setDescription(result.data.description);
    setMessage('Saved');
  };

  return (
    <li className="border-border rounded-xl border p-4">
      <div className="flex flex-wrap items-start gap-3">
        <Eyebrow>Episode #{episode.episodeNumber}</Eyebrow>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{episode.title}</p>
          <p className="text-foreground-secondary mt-1 text-xs">
            {episodeStatusLabel(episode)} ·{' '}
            {episode.source === 'broadcast' ? 'Recorded' : 'Uploaded'}
          </p>
        </div>
        <Button
          size="sm"
          variant="text"
          onClick={() => setStatsOpen((open) => !open)}
          aria-expanded={statsOpen}
        >
          <BarChart3Icon size={14} aria-hidden />
          Statistics
        </Button>
      </div>

      <div className="mt-4 grid gap-3">
        <Input
          label="Episode title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-foreground-secondary text-xs uppercase">
            Description
          </span>
          <Textarea
            tone="secondary"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {message ? (
            <span className="text-foreground-secondary text-xs">{message}</span>
          ) : (
            <span />
          )}
          <SaveButton
            saving={saving}
            label="Save episode"
            onClick={() => void save()}
          />
        </div>
      </div>

      {statsOpen ? (
        <div className="border-border bg-background-secondary/40 mt-4 grid gap-3 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-foreground-secondary text-xs uppercase">
              Status
            </p>
            <p className="mt-1 text-sm font-medium">
              {episodeStatusLabel(episode)}
            </p>
          </div>
          <div>
            <p className="text-foreground-secondary text-xs uppercase">
              Source
            </p>
            <p className="mt-1 text-sm font-medium">
              {episode.source === 'broadcast'
                ? 'Broadcast recording'
                : 'Uploaded audio'}
            </p>
          </div>
          <div>
            <p className="text-foreground-secondary text-xs uppercase">Audio</p>
            <p className="mt-1 text-sm font-medium">
              {episode.soundId ? 'Attached' : 'Not attached'}
            </p>
          </div>
          <div>
            <p className="text-foreground-secondary text-xs uppercase">
              Created
            </p>
            <p className="mt-1 text-sm font-medium">
              {new Date(episode.createdAt).toLocaleDateString()}
            </p>
          </div>
          {episode.slotStartAt ? (
            <div className="sm:col-span-2 lg:col-span-4">
              <p className="text-foreground-secondary text-xs uppercase">
                Scheduled
              </p>
              <p className="mt-1 text-sm font-medium">
                {new Date(episode.slotStartAt).toLocaleString()}
              </p>
            </div>
          ) : null}
          <p className="text-foreground-secondary text-xs sm:col-span-2 lg:col-span-4">
            Listener play and download totals will appear here when
            episode-level analytics are available.
          </p>
        </div>
      ) : null}
    </li>
  );
}
