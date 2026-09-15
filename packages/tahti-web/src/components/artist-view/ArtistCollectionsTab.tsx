import { Link } from '@tanstack/react-router';

import type { PublicProfileCollection } from '../../api/types';

type Props = {
  collections: PublicProfileCollection[];
  username: string;
};

/** ArtistView's "Collections" tab body. */
export function ArtistCollectionsTab({ collections, username }: Props) {
  if (collections.length === 0) {
    return (
      <section className="flex flex-col gap-3">
        <p className="text-foreground-secondary text-sm">
          No public collections.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
        {collections.map((col) => (
          <li
            key={col.slug}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div>
              <Link
                to="/u/$username/c/$slug"
                params={{ username, slug: col.slug }}
                className="font-medium underline-offset-2 hover:underline"
              >
                {col.name}
              </Link>
              <div className="text-foreground-secondary text-xs">
                {col.itemCount} items
                {col.isFeatured ? ', featured' : ''}
              </div>
            </div>
            <span className="text-foreground-secondary font-mono text-xs uppercase">
              {col.type}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
