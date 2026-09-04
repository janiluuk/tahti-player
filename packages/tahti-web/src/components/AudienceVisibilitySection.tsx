import { Link } from '@tanstack/react-router';
import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, Select, Toggle, Tooltip } from '@tahti-player/ui';

import { fetchMyFanTiers, type FanTierRow } from '../api/fan-tiers';

export type TrackVisibility = 'PUBLIC' | 'UNLISTED' | 'PRIVATE' | 'STASH';

export function AudienceVisibilitySection({
  visibility,
  onVisibilityChange,
  tierIds,
  onTierIdsChange,
}: {
  visibility: TrackVisibility;
  onVisibilityChange: (visibility: TrackVisibility) => void;
  tierIds: string[];
  onTierIdsChange: (tierIds: string[]) => void;
}) {
  const [tiers, setTiers] = useState<FanTierRow[]>([]);

  useEffect(() => {
    void fetchMyFanTiers().then((result) => setTiers(result.data));
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <Select
        label="Audience"
        options={[
          { id: 'PUBLIC', label: 'Public' },
          { id: 'UNLISTED', label: 'Not listed — direct link only' },
          { id: 'PRIVATE', label: 'Private — only you' },
          { id: 'STASH', label: 'Stash — selected tiers' },
        ]}
        value={visibility}
        onValueChange={(value) => onVisibilityChange(value as TrackVisibility)}
      />
      {visibility === 'STASH' ? (
        <div className="border-border bg-background-secondary rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Included fan tiers</p>
              <p className="text-foreground-secondary text-xs">
                Only selected subscribers can access this item.
              </p>
            </div>
            <Link to="/studio/revenue">
              <Tooltip content="Add fan tier" side="top">
                <Button
                  size="icon-sm"
                  variant="secondary"
                  aria-label="Add fan tier"
                >
                  <PlusIcon size={15} aria-hidden />
                </Button>
              </Tooltip>
            </Link>
          </div>
          {tiers.length > 0 ? (
            <div className="mt-3 flex flex-col gap-2">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span>{tier.name}</span>
                  <Toggle
                    label={tier.name}
                    checked={tierIds.includes(tier.id)}
                    onChange={(checked) =>
                      onTierIdsChange(
                        checked
                          ? [...tierIds, tier.id]
                          : tierIds.filter((id) => id !== tier.id),
                      )
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-foreground-secondary mt-3 text-xs">
              No fan tiers yet. Add a tier to share this item with subscribers.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
