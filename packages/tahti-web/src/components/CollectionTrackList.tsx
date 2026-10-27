import { useId, type ReactNode } from 'react';

import type { TahtiPlayable } from '../api/types';
import type { AmbientTrackStats } from './AmbientTrackRow';
import { PageEmpty } from './PageStates';
import { PlayableAmbientTrackList } from './PlayableAmbientTrackList';
import { Eyebrow } from './tahti/Eyebrow';

type CollectionTrackListProps = {
  items: TahtiPlayable[];
  title?: string;
  empty?: { title: string; description?: string } | null;
  compactActions?: boolean;
  getAnnotation?: (item: TahtiPlayable) => ReactNode;
  getTrackMeta?: (item: TahtiPlayable) =>
    | {
        genre?: string | null;
        stats?: AmbientTrackStats;
        downloadable?: boolean;
      }
    | undefined;
};

/** The track list of a playlist or release page: framed ambient rows, or
 * the empty state when nothing can play. Without `empty` an empty list
 * renders nothing, for pages that explain the gap elsewhere. */
export function CollectionTrackList({
  items,
  title,
  empty,
  compactActions,
  getAnnotation,
  getTrackMeta,
}: CollectionTrackListProps) {
  const headingId = useId();
  if (items.length === 0) {
    return empty ? (
      <PageEmpty title={empty.title} description={empty.description} />
    ) : null;
  }
  return (
    <section
      aria-labelledby={title ? headingId : undefined}
      className="flex flex-col gap-3"
      data-testid="collection-track-list"
    >
      {title ? (
        <h2 id={headingId}>
          <Eyebrow>{title}</Eyebrow>
        </h2>
      ) : null}
      <div className="shadow-float rounded-[var(--radius-card)]">
        <PlayableAmbientTrackList
          items={items}
          compactActions={compactActions}
          getAnnotation={getAnnotation}
          getTrackMeta={getTrackMeta}
        />
      </div>
    </section>
  );
}
