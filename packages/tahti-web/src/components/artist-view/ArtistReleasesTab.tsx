import { Link } from '@tanstack/react-router';

import { Card, CardGrid } from '@tahti-player/ui';

import type { PublicProfileRelease } from '../../api/types';
import { placeholderArtworkUrl } from '../../lib/placeholderArt';

type Props = {
  releases: PublicProfileRelease[];
};

/** ArtistView's "Releases" tab body. */
export function ArtistReleasesTab({ releases }: Props) {
  if (releases.length === 0) {
    return (
      <section className="flex flex-col gap-3">
        <p className="text-foreground-secondary text-sm">
          No published releases.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <CardGrid>
        {releases.map((rel) => (
          <div key={rel.id} className="flex flex-col gap-2">
            {rel.smartLinkSlug ? (
              <Link to="/r/$slug" params={{ slug: rel.smartLinkSlug }}>
                <Card
                  title={rel.title}
                  subtitle={rel.type ?? 'Release'}
                  src={rel.artworkUrl ?? placeholderArtworkUrl(rel.id)}
                />
              </Link>
            ) : (
              <Card
                title={rel.title}
                subtitle={rel.type ?? 'Release'}
                src={rel.artworkUrl ?? placeholderArtworkUrl(rel.id)}
              />
            )}
          </div>
        ))}
      </CardGrid>
    </section>
  );
}
