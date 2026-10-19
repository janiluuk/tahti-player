import { ListMusicIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, Select } from '@tahti-player/ui';

import { fetchStudioCollections } from '../api/studio';
import type { StudioCollection } from '../api/studio-types';
import { PageEmpty } from './PageStates';

type Props = {
  /** Already-used playlist slugs on the page (still selectable to re-show). */
  usedSlugs?: string[];
  /** Pre-select a slug (e.g. the block currently being edited). */
  initialSlug?: string;
  confirmLabel?: string;
  /** When true, changing the select applies immediately (no confirm button). */
  applyOnChange?: boolean;
  onPick: (playlistSlug: string) => void;
};

function isPlaylistCollection(collection: StudioCollection): boolean {
  const style = (collection.style ?? collection.type ?? '').toUpperCase();
  return style === 'PLAYLIST' || style === 'CUSTOM' || style === '';
}

export function ChannelPlaylistPicker({
  usedSlugs = [],
  initialSlug,
  confirmLabel = 'Add playlist',
  applyOnChange = false,
  onPick,
}: Props) {
  const [playlists, setPlaylists] = useState<StudioCollection[]>([]);
  const [selectedSlug, setSelectedSlug] = useState(initialSlug ?? '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchStudioCollections().then((result) => {
      if (cancelled) {
        return;
      }
      const next = result.data.filter(isPlaylistCollection);
      setPlaylists(next);
      setSelectedSlug((current) => {
        if (
          initialSlug &&
          next.some((playlist) => playlist.slug === initialSlug)
        ) {
          return initialSlug;
        }
        return current || next[0]?.slug || '';
      });
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [initialSlug]);

  if (loading) {
    return (
      <p className="text-foreground-secondary text-xs">Loading playlists…</p>
    );
  }

  if (playlists.length === 0) {
    return (
      <PageEmpty title="No playlists in your library yet. Create one under Studio → Collections." />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Select
        label="Playlist"
        value={selectedSlug}
        onValueChange={(slug) => {
          setSelectedSlug(slug);
          if (applyOnChange && slug) {
            onPick(slug);
          }
        }}
        options={playlists.map((playlist) => {
          const used = usedSlugs.includes(playlist.slug);
          return {
            id: playlist.slug,
            label: `${playlist.name}${used ? ' · on page' : ''} · ${
              playlist.itemCount ?? playlist.items?.length ?? 0
            } tracks`,
          };
        })}
      />
      {applyOnChange ? null : (
        <Button
          size="sm"
          disabled={!selectedSlug}
          onClick={() => {
            if (selectedSlug) {
              onPick(selectedSlug);
            }
          }}
        >
          <span className="inline-flex items-center gap-1.5">
            <ListMusicIcon size={14} aria-hidden />
            {confirmLabel}
          </span>
        </Button>
      )}
    </div>
  );
}
