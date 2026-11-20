import type { ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { SectionTitle, type CardsRowBadgeColor } from '@tahti-player/ui';

import {
  CardsRowSkeleton,
  ContentReveal,
  PageEmpty,
  PageError,
  TrackListSkeleton,
} from '../PageStates';
import type { ListenSectionStatus } from './useListenSections';

export type ListenSectionSkeleton = 'cards' | 'list';

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
  /** Section-level buttons beside the heading, shown in every state. */
  actions?: ReactNode;
  /** Loading placeholder shape. `cards` matches CardsRow; `list` matches
   * ambient track lists (e.g. New tracks). */
  skeleton?: ListenSectionSkeleton;
  /** Rendered once the section is ready and has content; usually a
   * `CardsRow` or table that brings its own heading and `data-testid`. */
  children: ReactNode;
};

/** One Listen dashboard section with its own loading, error (with Retry)
 * and empty states, so a slow or failed request never reads as "nothing
 * here" and never affects the other sections. Loading reserves the final
 * layout height with skeletons; ready content fades in. */
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
  actions,
  skeleton = 'cards',
  children,
}: ListenSectionProps) {
  const { t } = useTranslation('web');
  if (status === 'ready' && !empty) {
    return <ContentReveal>{children}</ContentReveal>;
  }
  return (
    <section
      className="flex flex-col gap-3"
      data-testid={testId}
      data-status={status}
      aria-busy={status === 'loading'}
      aria-label={
        status === 'loading'
          ? t('listenSection.loading', { title: title.toLowerCase() })
          : undefined
      }
    >
      {actions ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionTitle title={title} badge={badge} badgeColor={badgeColor} />
          <div className="flex items-center gap-2">{actions}</div>
        </div>
      ) : (
        <SectionTitle title={title} badge={badge} badgeColor={badgeColor} />
      )}
      {status === 'loading' ? (
        skeleton === 'list' ? (
          <TrackListSkeleton chrome={false} rows={4} />
        ) : (
          <CardsRowSkeleton chrome={false} cards={5} />
        )
      ) : status === 'error' ? (
        <PageError
          title={t('listenSection.couldNotLoad', { title })}
          description={t('loadErrors.theRestOfListenStillWorks')}
          onRetry={onRetry}
        />
      ) : (
        <PageEmpty title={emptyTitle} description={emptyDescription} />
      )}
    </section>
  );
}
