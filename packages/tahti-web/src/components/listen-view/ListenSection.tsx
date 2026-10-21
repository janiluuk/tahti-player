import type { ReactNode } from 'react';

import { SectionTitle, type CardsRowBadgeColor } from '@tahti-player/ui';

import { PageEmpty, PageError, PageLoading } from '../PageStates';
import type { ListenSectionStatus } from './useListenSections';

export type ListenSectionProps = {
  title: string;
  badge?: string;
  /** Section-meaning hue (live = green, radio = cyan, history = yellow…). */
  badgeColor?: CardsRowBadgeColor;
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
  badgeColor = 'purple',
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
      <SectionTitle title={title} badge={badge} badgeColor={badgeColor} />
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
