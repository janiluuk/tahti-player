import type { ReactNode } from 'react';

import { Badge } from '@tahti-player/ui';

import { PageEmpty, PageError, PageLoading } from '../PageStates';
import type { ListenSectionStatus } from './useListenSections';

export type ListenSectionProps = {
  title: string;
  badge?: string;
  status: ListenSectionStatus;
  empty: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  onRetry: () => void;
  'data-testid'?: string;
  /** Rendered once the section is ready and has content; usually a
   * `CardsRow` or table that brings its own heading and `data-testid`. */
  children: ReactNode;
};

/** One Listen dashboard section with its own loading, error (with Retry)
 * and empty states, so a slow or failed request never reads as "nothing
 * here" and never affects the other sections. */
export function ListenSection({
  title,
  badge,
  status,
  empty,
  emptyTitle,
  emptyDescription,
  onRetry,
  'data-testid': testId,
  children,
}: ListenSectionProps) {
  if (status === 'ready' && !empty) {
    return children;
  }
  return (
    <section
      className="flex flex-col gap-3"
      data-testid={testId}
      data-status={status}
      aria-busy={status === 'loading'}
    >
      <div className="flex items-center gap-2">
        <h2 className="text-foreground text-lg font-bold whitespace-nowrap">
          {title}
        </h2>
        {badge && (
          <Badge variant="pill" color="purple">
            {badge}
          </Badge>
        )}
      </div>
      {status === 'loading' ? (
        <PageLoading label={`Loading ${title.toLowerCase()}…`} />
      ) : status === 'error' ? (
        <PageError
          title={`${title} couldn't load`}
          description="The rest of Listen still works."
          onRetry={onRetry}
        />
      ) : (
        <PageEmpty title={emptyTitle} description={emptyDescription} />
      )}
    </section>
  );
}
