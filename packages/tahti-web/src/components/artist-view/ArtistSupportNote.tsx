import { HandCoins } from 'lucide-react';

import { ButtonAnchor } from '@tahti-player/ui';

import type { PublicProfile } from '../../api/types';
import { isHttpUrl } from '../../lib/parseRss';

/** Ways to support the artist: fan tier prices and their tip jar link. */
export function ArtistSupportNote({
  tiers,
  tipJarUrl,
}: {
  tiers: PublicProfile['fanTiers'];
  tipJarUrl?: string | null;
}) {
  const tipJarHref =
    tipJarUrl && isHttpUrl(tipJarUrl) ? tipJarUrl.trim() : null;
  if (tiers.length === 0 && !tipJarHref) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      {tiers.length > 0 ? (
        <p className="text-foreground-secondary text-xs">
          Fan tiers:{' '}
          {tiers
            .map((t) => `${t.name} (€${(t.amountCents / 100).toFixed(0)})`)
            .join(', ')}
        </p>
      ) : null}
      {tipJarHref ? (
        <ButtonAnchor
          href={tipJarHref}
          target="_blank"
          rel="noopener noreferrer"
          size="sm"
          variant="secondary"
          data-testid="artist-tip-jar-link"
        >
          <HandCoins size={14} aria-hidden />
          Tip jar
        </ButtonAnchor>
      ) : null}
    </div>
  );
}
