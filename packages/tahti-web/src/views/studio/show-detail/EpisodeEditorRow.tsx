import { BarChart3Icon } from 'lucide-react';
import { useState } from 'react';

import { toBcp47, useTranslation } from '@tahti-player/i18n';
import {
  Button,
  EditIconButton,
  Input,
  SaveButton,
  Textarea,
} from '@tahti-player/ui';

import { patchEpisode, type StudioEpisode } from '../../../api/shows';
import { ListingDate } from '../../../components/ListingDate';
import { Eyebrow } from '../../../components/tahti/Eyebrow';
import { currentLocale } from '../../../lib/locale';
import { episodeStatusLabel } from '../StudioShowsView';

export function EpisodeEditorRow({
  episode,
  onSaved,
}: {
  episode: StudioEpisode;
  onSaved: (episode: StudioEpisode) => void;
}) {
  const { t } = useTranslation('web');
  const [title, setTitle] = useState(episode.title);
  const [description, setDescription] = useState(episode.description);
  const [saving, setSaving] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
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
    setEditing(false);
  };

  return (
    <li className="border-border rounded-xl border p-4">
      <div className="flex flex-wrap items-start gap-3">
        <Eyebrow>Episode #{episode.episodeNumber}</Eyebrow>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{episode.title}</p>
          <p className="text-foreground-secondary mt-1 text-xs">
            {episodeStatusLabel(episode)} ·{' '}
            {episode.source === 'broadcast'
              ? t('episodeEditorRowStates.recorded')
              : t('episodeEditorRowStates.uploaded')}
          </p>
        </div>
        <Button
          className="gap-1.5"
          size="sm"
          variant="text"
          onClick={() => setStatsOpen((open) => !open)}
          aria-expanded={statsOpen}
        >
          <BarChart3Icon size={14} aria-hidden />
          {t('episodeEditor.statistics')}
        </Button>
        <EditIconButton
          label={t('episodeEditorRowLabels.editTitle', {
            title: episode.title,
          })}
          editing={editing}
          variant={editing ? undefined : 'text'}
          onClick={() => {
            if (!editing) {
              setTitle(episode.title);
              setDescription(episode.description);
              setMessage(null);
            }
            setEditing(!editing);
          }}
        />
      </div>

      {editing ? (
        <form
          className="mt-4 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <Input
            label={t('episodeEditor.episodeTitle')}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <Textarea
            submitOnModEnter
            label={t('episodeEditor.description')}
            tone="secondary"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            {message ? (
              <span className="text-foreground-secondary text-xs">
                {message}
              </span>
            ) : (
              <span />
            )}
            <SaveButton
              saving={saving}
              label={t('episodeEditor.saveEpisode')}
              type="submit"
            />
          </div>
        </form>
      ) : (
        <>
          {episode.description ? (
            <p className="text-foreground-secondary mt-3 text-sm whitespace-pre-wrap">
              {episode.description}
            </p>
          ) : null}
          {message ? (
            <p className="text-foreground-secondary mt-2 text-xs">{message}</p>
          ) : null}
        </>
      )}

      {statsOpen ? (
        <div className="border-border bg-background-secondary/40 mt-4 grid gap-3 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-foreground-secondary text-xs uppercase">
              {t('episodeEditor.status')}
            </p>
            <p className="mt-1 text-sm font-medium">
              {episodeStatusLabel(episode)}
            </p>
          </div>
          <div>
            <p className="text-foreground-secondary text-xs uppercase">
              {t('episodeEditor.source')}
            </p>
            <p className="mt-1 text-sm font-medium">
              {episode.source === 'broadcast'
                ? t('episodeEditorRowStates.broadcastRecording')
                : t('episodeEditorRowStates.uploadedAudio')}
            </p>
          </div>
          <div>
            <p className="text-foreground-secondary text-xs uppercase">
              {t('episodeEditor.audio')}
            </p>
            <p className="mt-1 text-sm font-medium">
              {episode.soundId
                ? t('episodeEditorRowStates.attached')
                : t('episodeEditorRowStates.notAttached')}
            </p>
          </div>
          <div>
            <p className="text-foreground-secondary text-xs uppercase">
              {t('episodeEditor.created')}
            </p>
            <p className="mt-1 text-sm font-medium">
              <ListingDate value={episode.createdAt} />
            </p>
          </div>
          {episode.slotStartAt ? (
            <div className="sm:col-span-2 lg:col-span-4">
              <p className="text-foreground-secondary text-xs uppercase">
                {t('episodeEditor.scheduled')}
              </p>
              <p className="mt-1 text-sm font-medium">
                {new Date(episode.slotStartAt).toLocaleString(
                  toBcp47(currentLocale()),
                )}
              </p>
            </div>
          ) : null}
          <p className="text-foreground-secondary text-xs sm:col-span-2 lg:col-span-4">
            {t('episodeEditor.listenerPlayAndDownloadTotals')}
          </p>
        </div>
      ) : null}
    </li>
  );
}
