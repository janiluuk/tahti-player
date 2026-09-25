import { Link, useNavigate } from '@tanstack/react-router';

import { Card, CardGrid, MediaArtwork } from '@tahti-player/ui';

import type {
  PublicProfileCollection,
  PublicProfileRelease,
  TahtiPlayable,
} from '../../api/types';
import { placeholderArtworkUrl } from '../../lib/placeholderArt';
import { formatDuration } from '../../lib/playableToTrack';
import { soundIdFromPlayableId } from '../../lib/soundId';
import { PlayableTrackTable } from '../PlayableTrackTable';
import { releasePlayables } from '../ReleaseTracklistDialog';

export type RelatedArtist = {
  username: string;
  displayName: string;
};

function SectionHeading({ children }: { children: string }) {
  return <h2 className="mb-2 text-lg font-semibold">{children}</h2>;
}

export function ArtistPopularTracks({
  items,
  isOwner,
  onEditTrack,
}: {
  items: TahtiPlayable[];
  isOwner: boolean;
  onEditTrack: (soundId: string | null) => void;
}) {
  return (
    <section className="flex min-w-0 flex-col" data-testid="artist-popular">
      <SectionHeading>Popular tracks</SectionHeading>
      <PlayableTrackTable
        items={items}
        emptyMessage="No playable tracks on this profile."
        onEdit={
          isOwner
            ? (item) => onEditTrack(soundIdFromPlayableId(item.id))
            : undefined
        }
      />
    </section>
  );
}

export function ArtistRelatedArtists({
  artists,
}: {
  artists: RelatedArtist[];
}) {
  return (
    <section className="flex min-w-0 flex-col" data-testid="artist-related">
      <SectionHeading>Related artists</SectionHeading>
      <ul className="divide-border bg-primary text-primary-foreground border-border divide-y-(length:--border-width) border-(length:--border-width)">
        {artists.map((related) => (
          <li key={related.username}>
            <Link
              to="/u/$username"
              params={{ username: related.username }}
              className="hover:bg-background-secondary/20 flex items-center gap-3 pr-3"
            >
              <MediaArtwork
                size="sm"
                src={placeholderArtworkUrl(related.username)}
                alt=""
              />
              <span className="truncate text-sm">{related.displayName}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ArtistReleasesGrid({
  releases,
  artistName,
  channelSlug,
  isFavorite,
  onPlayRelease,
  onQueueRelease,
  onToggleFavorite,
  onTitleClick,
}: {
  releases: Array<{
    release: PublicProfileRelease;
    playable: TahtiPlayable | null;
  }>;
  artistName: string;
  channelSlug: string | undefined;
  isFavorite: (playable: TahtiPlayable) => boolean;
  onPlayRelease: (release: PublicProfileRelease) => void;
  onQueueRelease: (
    release: PublicProfileRelease,
    playables: TahtiPlayable[],
  ) => void;
  onToggleFavorite: (playable: TahtiPlayable) => void;
  onTitleClick: (release: PublicProfileRelease) => void;
}) {
  const navigate = useNavigate();
  return (
    <section className="flex flex-col" data-testid="artist-releases">
      <SectionHeading>Releases</SectionHeading>
      <CardGrid className="grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] pr-0">
        {releases.map(({ release, playable }) => {
          const playables = releasePlayables(release, artistName, channelSlug);
          const totalSec = (release.tracks ?? []).reduce(
            (total, track) => total + (track.durationSec ?? 0),
            0,
          );
          const subtitle = [
            release.type ?? 'Release',
            release.tracks?.length ? `${release.tracks.length} tracks` : null,
            totalSec > 0 ? formatDuration(totalSec) : null,
          ]
            .filter(Boolean)
            .join(' · ');
          return (
            <Card
              key={release.id}
              className="w-full"
              title={release.title}
              subtitle={subtitle}
              src={release.artworkUrl ?? placeholderArtworkUrl(release.id)}
              onClick={
                release.smartLinkSlug
                  ? () =>
                      void navigate({
                        to: '/r/$slug',
                        params: { slug: release.smartLinkSlug! },
                      })
                  : undefined
              }
              onTitleClick={() => onTitleClick(release)}
              onPlay={playable ? () => onPlayRelease(release) : undefined}
              playLabel={`Play ${release.title}`}
              onQueue={
                playables.length > 0
                  ? () => onQueueRelease(release, playables)
                  : undefined
              }
              queueLabel={`Queue ${release.title}`}
              onFavorite={
                playable ? () => onToggleFavorite(playable) : undefined
              }
              favorited={playable ? isFavorite(playable) : false}
            />
          );
        })}
      </CardGrid>
    </section>
  );
}

export function ArtistPlaylistsGrid({
  collections,
  username,
}: {
  collections: PublicProfileCollection[];
  username: string;
}) {
  const navigate = useNavigate();
  return (
    <section className="flex flex-col" data-testid="artist-playlists">
      <SectionHeading>Playlists</SectionHeading>
      <CardGrid className="grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] pr-0">
        {collections.map((collection) => (
          <Card
            key={collection.slug}
            className="w-full"
            title={collection.name}
            subtitle={[
              `${collection.itemCount} item${collection.itemCount === 1 ? '' : 's'}`,
              collection.type
                ? `${collection.type.charAt(0)}${collection.type.slice(1).toLowerCase()}`
                : null,
              collection.isFeatured ? 'Featured' : null,
            ]
              .filter(Boolean)
              .join(' · ')}
            src={collection.coverUrl ?? placeholderArtworkUrl(collection.slug)}
            onClick={() =>
              void navigate({
                to: '/u/$username/c/$slug',
                params: { username, slug: collection.slug },
              })
            }
          />
        ))}
      </CardGrid>
    </section>
  );
}
