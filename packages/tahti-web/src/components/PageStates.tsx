import { AlertCircle, Inbox, PackageOpen, Radio } from 'lucide-react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Alert,
  Button,
  CenteredLoader,
  EmptyState,
  Skeleton,
} from '@tahti-player/ui';

import { cn } from '../lib/cn';

const REVEAL =
  'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300 motion-safe:fill-mode-both';

/** Fade/slide-in when ready content mounts. Skips motion when reduced. */
export function ContentReveal({
  children,
  className,
  ...rest
}: {
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>) {
  return (
    <div className={cn(REVEAL, className)} {...rest}>
      {children}
    </div>
  );
}

/** Horizontal cards row placeholder — matches `CardsRow` cards layout height.
 * Pass `chrome={false}` when the parent already renders the section title. */
export function CardsRowSkeleton({
  cards = 5,
  chrome = true,
  className,
}: {
  cards?: number;
  chrome?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      data-testid="cards-row-skeleton"
      className={cn('flex flex-col gap-3', className)}
    >
      {chrome ? (
        <div className="flex min-h-10 items-center justify-between gap-4">
          <Skeleton shape="line" className="h-5 w-36 max-w-[40%]" />
          <Skeleton shape="line" className="hidden h-8 w-48 sm:block" />
        </div>
      ) : null}
      <div className="flex gap-2 overflow-hidden pb-2">
        {Array.from({ length: cards }, (_, index) => (
          <div key={index} className="flex w-46 shrink-0 flex-col gap-2 p-2">
            <Skeleton className="aspect-square w-full rounded-md" />
            <Skeleton shape="line" className="h-3 w-4/5" />
            <Skeleton shape="line" className="h-3 w-3/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Ambient / track list placeholder for New tracks and similar sections.
 * Pass `chrome={false}` when the parent already renders the section title. */
export function TrackListSkeleton({
  rows = 4,
  chrome = true,
  className,
}: {
  rows?: number;
  chrome?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      data-testid="track-list-skeleton"
      className={cn('flex flex-col gap-2', className)}
    >
      {chrome ? (
        <Skeleton shape="line" className="mb-1 h-5 w-40 max-w-[40%]" />
      ) : null}
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="border-border/40 bg-background-secondary flex items-center gap-3 rounded-lg border p-2.5"
        >
          <Skeleton className="size-16 shrink-0 rounded-md sm:size-20" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton shape="line" className="h-3 w-1/3" />
            <Skeleton shape="line" className="h-4 w-2/3" />
            <Skeleton className="mt-1 h-9 w-full rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Radio / channel hero while the station payload loads. */
export function HeroSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      data-testid="hero-skeleton"
      className={cn('flex flex-col gap-6', className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton shape="line" className="h-7 w-48 max-w-[70%]" />
          <Skeleton shape="line" className="h-4 w-28" />
          <Skeleton shape="line" className="mt-1 h-4 w-full max-w-md" />
        </div>
        <Skeleton className="size-8 shrink-0 rounded-md" />
      </div>
      <Skeleton className="h-56 w-full rounded-lg sm:h-72" />
    </div>
  );
}

/** Artist / channel profile shell while the public profile loads. */
export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      data-testid="profile-skeleton"
      className={cn(
        'relative isolate -mx-6 -mt-6 flex min-h-full flex-col gap-4 overflow-hidden p-6 md:-mx-8 md:-mt-8 md:p-8',
        className,
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <Skeleton className="size-28 shrink-0 rounded-lg sm:size-36" />
        <div className="flex min-w-0 flex-1 flex-col gap-2 pb-1">
          <Skeleton shape="line" className="h-8 w-56 max-w-[80%]" />
          <Skeleton shape="line" className="h-4 w-32" />
          <Skeleton shape="line" className="h-4 w-full max-w-lg" />
          <div className="mt-2 flex flex-wrap gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
      </div>
      <div className="border-border flex flex-wrap gap-2 border-b pb-3">
        <Skeleton className="h-9 w-20 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-20 rounded-md" />
      </div>
      <TrackListSkeleton rows={3} />
    </div>
  );
}

export function RouteChunkSkeleton() {
  const { t } = useTranslation('web');
  return (
    <div
      className="flex flex-col gap-6 px-1 py-2"
      role="status"
      aria-label={t('pageStates.loadingPage')}
    >
      <div className="flex flex-col gap-2">
        <Skeleton shape="line" className="h-6 w-40 max-w-[55%]" />
        <Skeleton shape="line" className="h-4 w-full max-w-md" />
      </div>
      <CardsRowSkeleton cards={4} />
      <TrackListSkeleton rows={2} />
    </div>
  );
}

export function PageLoading({ label }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-10">
      <CenteredLoader size="lg" />
      {label && <p className="text-foreground-secondary text-sm">{label}</p>}
    </div>
  );
}

export function PageGate({
  page,
  icon,
  title,
  description,
  action,
}: {
  page: string | null;
  icon: ReactNode;
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <>
      {page ? <h1 className="sr-only">{page}</h1> : null}
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={action}
      />
    </>
  );
}

export function PageEmpty({
  title,
  description,
  action,
  icon = 'inbox',
  className,
  headingLevel,
  'data-testid': testId,
}: {
  title: string;
  headingLevel?: 1 | 2;
  description?: string;
  action?: ReactNode;
  icon?: 'inbox' | 'package' | 'radio' | 'alert';
  className?: string;
  'data-testid'?: string;
}) {
  const Icon =
    icon === 'radio'
      ? Radio
      : icon === 'package'
        ? PackageOpen
        : icon === 'alert'
          ? AlertCircle
          : Inbox;
  return (
    <EmptyState
      size="sm"
      className={className}
      data-testid={testId}
      icon={<Icon size={40} className="opacity-40" />}
      title={title}
      headingLevel={headingLevel}
      description={description}
      action={action}
    />
  );
}

export function PageError({
  title = 'Something went wrong',
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  const { t } = useTranslation('web');
  return (
    <EmptyState
      size="sm"
      icon={
        <AlertCircle size={40} className="text-accent-red-strong opacity-80" />
      }
      title={title}
      description={description}
      action={
        onRetry ? (
          <Button size="sm" onClick={onRetry} variant="secondary">
            {t('pageStates.retry')}
          </Button>
        ) : undefined
      }
    />
  );
}

export function PageErrorBanner({
  title,
  description,
  onRetry,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
}) {
  const { t } = useTranslation('web');
  return (
    <Alert tone="error" title={title}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {description ? <span>{description}</span> : <span />}
        {onRetry ? (
          <Button size="sm" variant="secondary" onClick={onRetry}>
            {t('pageStates.retry')}
          </Button>
        ) : null}
      </div>
    </Alert>
  );
}
