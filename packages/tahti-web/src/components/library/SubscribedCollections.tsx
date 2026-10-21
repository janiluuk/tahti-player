import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Card, CardGrid, SectionShell } from '@tahti-player/ui';

import {
  fetchSubscribedCollections,
  type SubscribedCollection,
} from '../../api/collection-subscriptions';
import { placeholderArtworkUrl } from '../../lib/placeholderArt';
import { PageError } from '../PageStates';

/** Collections you subscribed to on other people's pages. Hidden until
 * there is at least one. */
export function SubscribedCollections() {
  const [items, setItems] = useState<SubscribedCollection[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    void fetchSubscribedCollections().then(({ data, meta }) => {
      if (!cancelled) {
        setLoadError(meta.source === 'api' ? (meta.reason ?? null) : null);
        setItems(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (loadError) {
    return (
      <SectionShell title="Subscribed">
        <PageError
          title="Could not load subscribed collections"
          description={loadError}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      </SectionShell>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <SectionShell title="Subscribed">
      <CardGrid>
        {items.map((collection) => (
          <Link
            key={collection.slug}
            to="/u/$username/c/$slug"
            params={{
              username: collection.ownerUsername,
              slug: collection.slug,
            }}
          >
            <Card
              title={collection.name}
              subtitle={`${collection.ownerDisplayName} · ${collection.itemCount} ${
                collection.itemCount === 1 ? 'track' : 'tracks'
              }`}
              src={
                collection.coverUrl ?? placeholderArtworkUrl(collection.slug)
              }
            />
          </Link>
        ))}
      </CardGrid>
    </SectionShell>
  );
}
