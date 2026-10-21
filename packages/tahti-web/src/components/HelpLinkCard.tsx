import { ArrowRightIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Box } from '@tahti-player/ui';

/** A linked card used by Help and Studio → Governance → Documents. */
export function HelpLinkCard({
  title,
  description,
  meta,
  icon,
}: {
  title: string;
  description: string;
  meta?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Box
      variant="tertiary"
      shadow="default"
      className="group hover:border-primary flex min-h-32 min-w-0 flex-col justify-between gap-3 transition-colors"
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display min-w-0 text-base font-bold tracking-tight">
              {title}
            </h3>
            <ArrowRightIcon
              size={17}
              aria-hidden
              className="text-foreground-secondary mt-0.5 shrink-0 transition-transform group-hover:translate-x-0.5"
            />
          </div>
          <p className="text-foreground-secondary mt-2 text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      {meta ? <div className="mt-auto">{meta}</div> : null}
    </Box>
  );
}
