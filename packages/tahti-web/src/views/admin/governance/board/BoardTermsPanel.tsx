import { UserPlusIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button } from '@tahti-player/ui';

import {
  fetchAdminBoardTerms,
  type AdminBoardTerm,
} from '../../../../api/admin/admin-governance-board';
import { BOARD_ROLE_LABELS } from '../../../../api/governance-board';
import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';
import { numericDay } from '../../../../lib/relativeDate';
import { AddBoardTermForm } from './AddBoardTermForm';
import { EndBoardTermForm } from './EndBoardTermForm';

export function isTermCurrent(term: AdminBoardTerm, now = new Date()): boolean {
  return (
    new Date(term.termStart) <= now &&
    (!term.termEnd || new Date(term.termEnd) > now)
  );
}

function termStatus(term: AdminBoardTerm): {
  label: string;
  color: 'green' | 'secondary' | 'blue';
} {
  if (isTermCurrent(term)) {
    return { label: 'Serving', color: 'green' };
  }
  if (new Date(term.termStart) > new Date()) {
    return { label: 'Starts later', color: 'blue' };
  }
  return { label: 'Ended', color: 'secondary' };
}

/** Every board term the association has recorded, current ones first. */
export function BoardTermsPanel() {
  const { t } = useTranslation('web');
  const [terms, setTerms] = useState<AdminBoardTerm[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

  const load = useCallback(async () => {
    const result = await fetchAdminBoardTerms();
    setTerms(result.data);
    setLoadError(
      result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = terms
    ? [...terms].sort(
        (a, b) =>
          Number(isTermCurrent(b)) - Number(isTermCurrent(a)) ||
          b.termStart.localeCompare(a.termStart),
      )
    : null;
  const showEmpty = sorted?.length === 0 && !loadError;

  return (
    <StudioPanel title={t('boardTermsPanelText.boardTerms')}>
      {composing ? (
        <AddBoardTermForm
          onClose={() => setComposing(false)}
          onAdded={() => void load()}
        />
      ) : sorted === null || showEmpty ? null : (
        <Button size="sm" className="w-fit" onClick={() => setComposing(true)}>
          <UserPlusIcon size={16} aria-hidden />
          {t('adminGovernance.addBoardTerm')}
        </Button>
      )}
      {sorted === null ? (
        <PageLoading label={t('loading.loadingBoardTerms')} />
      ) : loadError && sorted.length === 0 ? (
        <PageError
          title={t('loadErrors.couldNotLoadBoardTerms')}
          description={loadError}
          onRetry={() => {
            setTerms(null);
            void load();
          }}
        />
      ) : sorted.length === 0 ? (
        <PageEmpty
          title={t('empties.noBoardTermsRecordedYet')}
          action={
            composing ? undefined : (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setComposing(true)}
              >
                <UserPlusIcon size={16} aria-hidden />
                {t('adminGovernance.addBoardTerm')}
              </Button>
            )
          }
        />
      ) : (
        <ul className="divide-border divide-y">
          {sorted.map((term) => {
            const status = termStatus(term);
            return (
              <li
                key={term.id}
                className="flex flex-col gap-1 py-2 text-sm first:pt-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{term.displayName}</span>
                  <span className="text-foreground-secondary text-xs">
                    {BOARD_ROLE_LABELS[term.role]}
                  </span>
                  <Badge variant="pill" color={status.color}>
                    {status.label}
                  </Badge>
                </div>
                <p className="text-foreground-secondary text-xs">
                  {numericDay(term.termStart)} –{' '}
                  {term.termEnd ? numericDay(term.termEnd) : 'open-ended'}
                  {term.endReason ? ` · ${term.endReason}` : ''}
                </p>
                {status.label !== 'Ended' ? (
                  <EndBoardTermForm term={term} onEnded={() => void load()} />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </StudioPanel>
  );
}
