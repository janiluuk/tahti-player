import { SearchIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  Dialog,
  EditIconButton,
  InlineError,
  Input,
  MediaArtwork,
  SaveButton,
  Select,
  Textarea,
  Toggle,
} from '@tahti-player/ui';

import {
  deleteAdminChannelSound,
  fetchAdminChannelSounds,
  patchAdminChannelSound,
  type AdminChannelSound,
} from '../../../api/admin';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { PageEmpty } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import {
  selectableContentTypes,
  type ContentTypeId,
} from '../../../content/contentTypes';

const PAGE_SIZE = 50;

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
  const [tags, setTags] = useState((sound.tags ?? []).join(', '));
  const [contentType, setContentType] = useState<ContentTypeId | ''>(
    (sound.contentType as ContentTypeId | null | undefined) ?? '',
  );
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
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 20),
      ...(contentType ? { contentType } : {}),
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
        <Input
          label={t('adminChannelTracks.tags')}
          value={tags}
          maxLength={400}
          placeholder={t('adminChannelTracks.tagsPlaceholder')}
          onChange={(event) => setTags(event.target.value)}
        />
        <Select
          label={t('adminChannelTracks.contentType')}
          value={contentType || 'UNCHANGED'}
          onValueChange={(value) =>
            setContentType(
              value === 'UNCHANGED' ? '' : (value as ContentTypeId),
            )
          }
          options={[
            {
              id: 'UNCHANGED',
              label: t('adminChannelTracks.leaveContentType'),
            },
            ...selectableContentTypes(t).map((type) => ({
              id: type.id,
              label: type.label,
            })),
          ]}
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
  const [query, setQuery] = useState('');
  const [slug, setSlug] = useState<string | null>(null);
  const [sounds, setSounds] = useState<AdminChannelSound[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminChannelSound | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminChannelSound | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const load = (nextOffset = 0, nextSlug = slugInput.trim().toLowerCase()) => {
    setLoading(true);
    setError(null);
    void fetchAdminChannelSounds(nextSlug, {
      limit: PAGE_SIZE,
      offset: nextOffset,
      q: query,
    }).then((result) => {
      setLoading(false);
      if (!result.ok) {
        setSlug(null);
        setSounds([]);
        setTotal(0);
        setError(result.error);
        return;
      }
      setSlug(nextSlug);
      setOffset(nextOffset);
      setSounds(result.data);
      setTotal(result.total);
    });
  };

  const confirmDelete = () => {
    if (!slug || !pendingDelete || deleting) {
      return;
    }
    const doomed = pendingDelete;
    setPendingDelete(null);
    setDeleting(true);
    void deleteAdminChannelSound(slug, doomed.id).then((result) => {
      setDeleting(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      load(offset, slug);
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
          load(0);
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
        <Input
          type="search"
          label={t('adminChannelTracks.searchTracks')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="max-w-xs"
        />
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          disabled={loading || !slugInput.trim()}
        >
          <SearchIcon size={14} aria-hidden className="mr-1.5" />
          {loading
            ? t('channelTracksPanelStates.loading')
            : t('channelTracksPanelStates.openTracks')}
        </Button>
      </form>

      {error ? <InlineError className="mt-3">{error}</InlineError> : null}

      {slug ? (
        sounds.length === 0 ? (
          <PageEmpty title={t('empties.channelNoTracks')} />
        ) : (
          <>
            <p className="text-foreground-secondary mt-3 text-sm">
              {t('adminChannelTracks.pageSummary', {
                shown: sounds.length,
                total,
              })}
            </p>
            <ul
              className="divide-border mt-2 divide-y"
              data-testid="channel-tracks"
            >
              {sounds.map((sound) => (
                <li
                  key={sound.id}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <MediaArtwork
                      src={sound.bannerUrl ?? undefined}
                      alt=""
                      seed={sound.id}
                      size="thumb"
                      className="size-8 min-w-8 rounded-sm"
                    />
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
                  <span className="flex shrink-0 items-center gap-1">
                    <EditIconButton
                      variant="text"
                      label={t('channelTracksPanelLabels.editTitle', {
                        title: sound.title,
                      })}
                      onClick={() => setEditing(sound)}
                    />
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="text"
                      className="text-destructive"
                      aria-label={t('adminChannelTracks.removeTrack', {
                        title: sound.title,
                      })}
                      onClick={() => setPendingDelete(sound)}
                    >
                      <Trash2Icon size={14} aria-hidden />
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={loading || offset <= 0}
                onClick={() => load(Math.max(0, offset - PAGE_SIZE), slug)}
              >
                {t('adminChannelTracks.previousPage')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={loading || offset + sounds.length >= total}
                onClick={() => load(offset + PAGE_SIZE, slug)}
              >
                {t('adminChannelTracks.nextPage')}
              </Button>
            </div>
          </>
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

      <ConfirmDialog
        destructive
        isOpen={pendingDelete !== null}
        title={
          pendingDelete
            ? t('adminChannelTracks.deleteNamed', {
                title: pendingDelete.title,
              })
            : t('adminChannelTracks.deleteTrack')
        }
        description={t('adminChannelTracks.deleteCannotUndo')}
        confirmLabel={t('actions.delete')}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </StudioPanel>
  );
}
