import { PencilIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';

import {
  Badge,
  Button,
  Dialog,
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
      <Dialog.Title>Edit track</Dialog.Title>
      <Dialog.Description>
        Changes are logged in the audit log and show on the artist's channel
        right away.
      </Dialog.Description>
      <div className="mt-4 flex flex-col gap-3">
        <Input
          label="Title"
          value={title}
          maxLength={200}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Input
          label="Artist credit"
          value={artistName}
          maxLength={120}
          placeholder="Channel name"
          onChange={(event) => setArtistName(event.target.value)}
        />
        <Input
          label="Genre"
          value={genre}
          maxLength={80}
          onChange={(event) => setGenre(event.target.value)}
        />
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Description
          <Textarea
            value={description}
            maxLength={2000}
            rows={4}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <Toggle label="Public" checked={isPublic} onChange={setIsPublic} />
        {error ? (
          <p className="text-accent-red-strong text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <SaveButton
          disabled={saving || !title.trim()}
          saving={saving}
          label="Save track"
          onClick={save}
        />
      </Dialog.Actions>
    </Dialog.Root>
  );
}

export function ChannelTracksPanel() {
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
      title="Channel tracks"
      description="Fix a track's title, credit, genre, description or visibility on any channel, newest 200 first."
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
          {loading ? 'Loading…' : 'Open tracks'}
        </Button>
      </form>

      {error ? (
        <p className="text-accent-red-strong mt-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {slug ? (
        sounds.length === 0 ? (
          <p className="text-foreground-secondary mt-4 text-sm">
            This channel has no tracks.
          </p>
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
                      Private
                    </Badge>
                  ) : null}
                </span>
                <Button
                  size="icon-sm"
                  variant="text"
                  aria-label={`Edit ${sound.title}`}
                  onClick={() => setEditing(sound)}
                >
                  <PencilIcon size={14} aria-hidden />
                </Button>
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
