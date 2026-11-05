import { useCallback, useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge } from '@tahti-player/ui';

import {
  fetchGovernanceLegalHolds,
  type GovernanceLegalHold,
  type LegalHoldKind,
} from '../../../../api/admin/admin-governance-legal-holds';
import { ListingDate } from '../../../../components/ListingDate';
import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';

const KIND_LABELS: Record<LegalHoldKind, string> = {
  MEETING: 'Meeting',
  DOCUMENT: 'Document',
  RESOLUTION: 'Resolution',
  ANNUAL_REPORT: 'Annual report',
};

/** Everything under a legal hold, in one place. Held records are not
 * regenerated, corrected, archived or deleted until released where they live. */
export function LegalHoldsPanel() {
  const { t } = useTranslation('web');
  const [holds, setHolds] = useState<GovernanceLegalHold[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await fetchGovernanceLegalHolds();
    setHolds(result.data);
    setLoadError(
      result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <StudioPanel title="Legal holds">
      {holds === null ? (
        <PageLoading label="Loading legal holds…" />
      ) : loadError && holds.length === 0 ? (
        <PageError
          title={t('loadErrors.couldNotLoadLegalHolds')}
          description={loadError}
          onRetry={() => {
            setHolds(null);
            void load();
          }}
        />
      ) : holds.length === 0 ? (
        <PageEmpty title={t('empties.nothingIsOnLegalHold')} />
      ) : (
        <ul className="divide-border divide-y">
          {holds.map((hold) => (
            <li
              key={`${hold.kind}:${hold.id}`}
              className="flex flex-col gap-1 py-2 text-sm first:pt-0 last:pb-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="pill" color="secondary">
                  {KIND_LABELS[hold.kind]}
                </Badge>
                <span className="font-medium">{hold.title}</span>
              </div>
              <p className="text-foreground-secondary text-xs">
                Held since <ListingDate value={hold.legalHoldAt} />
                {hold.legalHoldReason ? ` · ${hold.legalHoldReason}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </StudioPanel>
  );
}
