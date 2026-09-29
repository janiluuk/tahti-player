import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { fetchChannelSlugRedirect } from '../../api/channel-redirect';
import { PageEmpty, PageLoading } from '../PageStates';

/** Shown for an unknown slug. A channel renamed in the last 30 days keeps a
 * redirect from its old address, so check that before saying it's gone. */
export function ChannelNotFound({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    void fetchChannelSlugRedirect(slug).then((newSlug) => {
      if (cancelled) {
        return;
      }
      if (newSlug) {
        void navigate({
          to: '/channel/$slug',
          params: { slug: newSlug },
          replace: true,
        });
        return;
      }
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [slug, navigate]);

  if (checking) {
    return <PageLoading label="Loading channel…" />;
  }

  return (
    <PageEmpty
      title="Channel not found"
      description="This channel may have been removed or is not available."
    />
  );
}
