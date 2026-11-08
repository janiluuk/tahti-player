import { AlertCircle, Inbox, PackageOpen, Radio } from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Alert, Button, CenteredLoader, EmptyState } from '@tahti-player/ui';

export function RouteChunkSkeleton() {
  const { t } = useTranslation('web');
  return (
    <div
      className="flex flex-col gap-3 px-1 py-2"
      role="status"
      aria-label={t('pageStates.loadingPage')}
    >
      <div className="bg-background-secondary/70 h-6 w-40 max-w-[55%] rounded-md motion-safe:animate-pulse" />
      <div className="bg-background-secondary/50 h-4 w-full max-w-md rounded-md motion-safe:animate-pulse" />
      <div className="bg-background-secondary/40 mt-1 h-4 w-3/4 max-w-sm rounded-md motion-safe:animate-pulse" />
    </div>
  );
}

export function PageLoading({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10">
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
