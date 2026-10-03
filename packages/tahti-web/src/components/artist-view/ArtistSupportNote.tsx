import { HandCoins } from 'lucide-react';

import { ButtonAnchor } from '@tahti-player/ui';

import type { PublicProfile } from '../../api/types';
import { humanizeFanTierPerk } from '../../lib/fanTierPerks';
import { isHttpUrl } from '../../lib/parseRss';
import { Eyebrow } from '../tahti/Eyebrow';

type FanTiers = PublicProfile['fanTiers'];

/** Ways to support the artist: their fan tiers and tip jar link. */
export function ArtistSupportNote({
  tiers,
  tipJarUrl,
}: {
  tiers: FanTiers;
  tipJarUrl?: string | null;
}) {
  const tipJarHref =
    tipJarUrl && isHttpUrl(tipJarUrl) ? tipJarUrl.trim() : null;
  if (tiers.length === 0 && !tipJarHref) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      {tiers.length > 0 ? <ArtistFanTiers tiers={tiers} /> : null}
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

function ArtistFanTiers({ tiers }: { tiers: FanTiers }) {
  const hasDetails = tiers.some(
    (t) => Boolean(t.description) || (t.perks?.length ?? 0) > 0,
  );
  if (!hasDetails) {
    return (
      <p className="text-foreground-secondary text-xs">
        Fan tiers:{' '}
        {tiers
          .map((t) => `${t.name} (${fanTierPrice(t.amountCents)})`)
          .join(', ')}
      </p>
    );
  }
  return (
    <section className="flex w-full flex-col gap-3" aria-label="Fan tiers">
      <Eyebrow>Fan tiers</Eyebrow>
      <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
        {tiers.map((tier) => (
          <li key={tier.id} className="flex flex-col gap-1 p-3 text-sm">
            <p className="font-medium">
              {tier.name}{' '}
              <span className="text-foreground-secondary">
                {fanTierPrice(tier.amountCents)}/mo
              </span>
            </p>
            {tier.description ? (
              <p className="text-foreground-secondary text-xs">
                {tier.description}
              </p>
            ) : null}
            {tier.perks && tier.perks.length > 0 ? (
              <ul
                className="text-foreground-secondary list-disc pl-4 text-xs"
                aria-label={`${tier.name} perks`}
              >
                {tier.perks.map((perk) => (
                  <li key={perk}>{humanizeFanTierPerk(perk)}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function fanTierPrice(amountCents: number): string {
  return `€${(amountCents / 100).toFixed(0)}`;
}
