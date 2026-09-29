import { Trash2Icon } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button, ExternalLink, Input, MediaArtwork } from '@tahti-player/ui';

import {
  addArtistEmbed,
  fetchArtistEmbeds,
  removeArtistEmbed,
  type ArtistEmbed,
} from '../api/artist-embeds';
import { PageError } from './PageStates';
import { StudioPanel } from './StudioPanel';

const MAX_EMBEDS = 20;

/** SoundCloud tracks shown on the artist's channel, added by public URL. */
export function SoundCloudEmbedsPanel() {
  const [embeds, setEmbeds] = useState<ArtistEmbed[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = () => {
    setFailed(false);
    void fetchArtistEmbeds().then((result) => {
      setEmbeds(result.data);
      setFailed(result.data === null);
    });
  };

  useEffect(load, []);

  const add = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      return;
    }
    setAdding(true);
    const result = await addArtistEmbed(trimmed);
    setAdding(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setEmbeds((current) => [result.data, ...(current ?? [])]);
    setUrl('');
  };

  const remove = async (id: string) => {
    setRemovingId(id);
    const result = await removeArtistEmbed(id);
    setRemovingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setEmbeds((current) => (current ?? []).filter((embed) => embed.id !== id));
  };

  const full = (embeds?.length ?? 0) >= MAX_EMBEDS;

  return (
    <StudioPanel
      title="SoundCloud tracks"
      description={`Public SoundCloud tracks shown on your channel, up to ${MAX_EMBEDS}.`}
    >
      {failed ? (
        <PageError
          title="Couldn't load your SoundCloud tracks"
          onRetry={load}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <form
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
            onSubmit={(event) => void add(event)}
          >
            <div className="min-w-0 flex-1">
              <Input
                label="SoundCloud track URL"
                value={url}
                placeholder="https://soundcloud.com/artist/track"
                disabled={full}
                onChange={(event) => setUrl(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={adding || full || !url.trim()}>
              {adding ? 'Adding…' : 'Add track'}
            </Button>
          </form>
          {embeds && embeds.length > 0 ? (
            <ul
              className="divide-border divide-y"
              data-testid="soundcloud-embeds"
            >
              {embeds.map((embed) => (
                <li key={embed.id} className="flex items-center gap-3 py-2">
                  <MediaArtwork src={embed.thumbnailUrl} alt="" size="thumb" />
                  <div className="min-w-0 flex-1 text-sm">
                    <ExternalLink
                      href={embed.url}
                      className="block truncate font-semibold no-underline"
                    >
                      {embed.title ?? embed.url}
                    </ExternalLink>
                    {embed.authorName ? (
                      <span className="text-foreground-secondary block truncate text-xs">
                        {embed.authorName}
                      </span>
                    ) : null}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    aria-label={`Remove ${embed.title ?? embed.url}`}
                    disabled={removingId === embed.id}
                    onClick={() => void remove(embed.id)}
                  >
                    <Trash2Icon size={14} aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          ) : embeds ? (
            <p className="text-foreground-secondary text-sm">
              No SoundCloud tracks yet.
            </p>
          ) : null}
        </div>
      )}
    </StudioPanel>
  );
}
