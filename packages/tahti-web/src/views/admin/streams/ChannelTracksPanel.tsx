import { SearchIcon } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  Dialog,
  EditIconButton,
  InlineError,
  Input,
  SaveButton,
  Textarea,
  Toggle,
} from '@tahti-player/ui';

import {
  fetchAdminChannelSounds,
  patchAdminChannelSound,
  type AdminChannelSound,
} from '../../../api/admin';
import { PageEmpty } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';

function TrackEditDialog({
  slug,
  sound,
  onClose,
  onSaved,
}: {
  slug: string;
  sound: AdminChannelSound;
  onClose: () => void;
  onSaved: (sound: AdminChannelSound) => void;
}) {
  const { t } = useTranslation('web');
  const [title, setTitle] = useState(sound.title);
  const [artistName, setArtistName] = useState(sound.artistName ?? '');
  const [genre, setGenre] = useState(sound.genre ?? '');
  const [description, setDescription] = useState(sound.description ?? '');
  const [isPublic, setIsPublic] = useState(sound.isPublic);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setSaving(true);
    setError(null);
    void patchAdminChannelSound(slug, sound.id, {
      title: title.trim(),
      artistName: artistName.trim() || null,
      genre: genre.trim() || null,
      description: description.trim(),
      isPublic,
    }).then((result) => {
      setSaving(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved(result.data);
    });
  };

  return (
    <Dialog.Root isOpen onClose={onClose} className="max-w-lg">
      <Dialog.Title>{t('adminChannelTracks.editTrack')}</Dialog.Title>
      <Dialog.Description>
        {t('adminChannelTracks.changesAreLoggedInThe')}
      </Dialog.Description>
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <Input
          label={t('adminChannelTracks.title')}
          value={title}
          maxLength={200}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Input
          label={t('adminChannelTracks.artistCredit')}
          value={artistName}
          maxLength={120}
          placeholder={t('adminChannelTracks.channelName')}
          onChange={(event) => setArtistName(event.target.value)}
        />
        <Input
          label={t('adminChannelTracks.genre')}
          value={genre}
          maxLength={80}
          onChange={(event) => setGenre(event.target.value)}
        />
        <Textarea
          label={t('adminChannelTracks.description')}
          value={description}
          maxLength={2000}
          rows={4}
          submitOnModEnter
          onChange={(event) => setDescription(event.target.value)}
        />
        <Toggle
          label={t('adminChannelTracks.public')}
          checked={isPublic}
          onChange={setIsPublic}
        />
        {error ? <InlineError>{error}</InlineError> : null}
        <Dialog.Actions>
          <Dialog.Close>{t('adminChannelTracks.cancel')}</Dialog.Close>
          <SaveButton
            type="submit"
            disabled={saving || !title.trim()}
            saving={saving}
            label={t('adminChannelTracks.saveTrack')}
          />
        </Dialog.Actions>
      </form>
    </Dialog.Root>
  );
}

export function ChannelTracksPanel() {
  const { t } = useTranslation('web');
  const [slugInput, setSlugInput] = useState('');
  const [slug, setSlug] = useState<string | null>(null);
  const [sounds, setSounds] = useState<AdminChannelSound[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminChannelSound | null>(null);

  const load = () => {
    const nextSlug = slugInput.trim().toLowerCase();
    setLoading(true);
    setError(null);
    void fetchAdminChannelSounds(nextSlug).then((result) => {
      setLoading(false);
      if (!result.ok) {
        setSlug(null);
        setSounds([]);
        setError(result.error);
        return;
      }
      setSlug(nextSlug);
      setSounds(result.data);
    });
  };

  return (
    <StudioPanel
      title={t('adminChannelTracks.channelTracks')}
      description={t('adminChannelTracks.fixATrackSTitle')}
    >
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          load();
        }}
      >
        <Input
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          label={t('adminChannelTracks.channelSlug')}
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
          {loading ? 'Loading…' : 'Open tracks'}
        </Button>
      </form>

      {error ? <InlineError className="mt-3">{error}</InlineError> : null}

      {slug ? (
        sounds.length === 0 ? (
          <PageEmpty title={t('empties.channelNoTracks')} />
        ) : (
          <ul
            className="divide-border mt-4 divide-y"
            data-testid="channel-tracks"
          >
            {sounds.map((sound) => (
              <li
                key={sound.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate font-medium">{sound.title}</span>
                  {sound.genre ? (
                    <span className="text-foreground-secondary text-xs">
                      {sound.genre}
                    </span>
                  ) : null}
                  {!sound.isPublic ? (
                    <Badge variant="pill" color="secondary">
                      {t('adminChannelTracks.private')}
                    </Badge>
                  ) : null}
                </span>
                <EditIconButton
                  variant="text"
                  label={`Edit ${sound.title}`}
                  onClick={() => setEditing(sound)}
                />
              </li>
            ))}
          </ul>
        )
      ) : null}

      {slug && editing ? (
        <TrackEditDialog
          slug={slug}
          sound={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setSounds((current) =>
              current.map((row) =>
                row.id === saved.id ? { ...row, ...saved } : row,
              ),
            );
            setEditing(null);
          }}
        />
      ) : null}
    </StudioPanel>
  );
}
