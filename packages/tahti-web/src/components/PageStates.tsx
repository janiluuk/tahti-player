import { AlertCircle, Inbox, PackageOpen, Radio } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button, CenteredLoader, EmptyState } from '@tahti-player/ui';

export function PageLoading({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10">
      <CenteredLoader size="lg" />
      {label && <p className="text-foreground-secondary text-sm">{label}</p>}
    </div>
  );
}

export function PageEmpty({
  title,
  description,
  action,
  icon = 'inbox',
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: 'inbox' | 'package' | 'radio' | 'alert';
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
      icon={<Icon size={40} className="opacity-40" />}
      title={title}
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
  return (
    <EmptyState
      size="sm"
      icon={<AlertCircle size={40} className="text-accent-red opacity-80" />}
      title={title}
      description={description}
      action={
        onRetry ? (
          <Button size="sm" onClick={onRetry} variant="secondary">
            Retry
          </Button>
        ) : undefined
      }
    />
  );
}
