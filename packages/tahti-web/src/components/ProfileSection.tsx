import { useId, type ComponentProps, type ReactNode } from 'react';

import { cn, SectionTitle } from '@tahti-player/ui';

import { PageEmpty, PageError, PageLoading } from './PageStates';

export type ProfileSectionStatus = 'loading' | 'error' | 'ready';

type ProfileSectionProps = Omit<ComponentProps<'section'>, 'title'> & {
  title?: string;
  status?: ProfileSectionStatus;
  loadingLabel?: string;
  errorTitle?: string;
  errorDescription?: string;
  onRetry?: () => void;
  empty?: { title: string; description?: string } | null;
  children?: ReactNode;
};

/** One section of an artist or channel profile: the shared heading plus the
 * loading, error and empty states, so both pages stack the same way. The
 * empty state shows only when `empty` is set; sections that hide when empty
 * leave it out. */
export function ProfileSection({
  title,
  status = 'ready',
  loadingLabel,
  errorTitle,
  errorDescription,
  onRetry,
  empty,
  className,
  children,
  ...props
}: ProfileSectionProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={title ? headingId : undefined}
      className={cn('flex min-w-0 flex-col', className)}
      {...props}
    >
      {title ? <SectionTitle id={headingId} title={title} /> : null}
      {status === 'loading' ? (
        <PageLoading label={loadingLabel} />
      ) : status === 'error' ? (
        <PageError
          title={errorTitle}
          description={errorDescription}
          onRetry={onRetry}
        />
      ) : empty ? (
        <PageEmpty title={empty.title} description={empty.description} />
      ) : (
        children
      )}
    </section>
  );
}
