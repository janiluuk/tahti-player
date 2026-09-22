import { ExternalLinkIcon } from 'lucide-react';

import { StudioPanel } from '../../../components/StudioPanel';

export function GuideDetail({
  title,
  steps,
  href,
  linkLabel,
}: {
  title: string;
  steps: readonly string[];
  href?: string;
  linkLabel?: string;
}) {
  return (
    <StudioPanel title={title}>
      <ol className="text-foreground-secondary list-inside list-decimal space-y-1">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {href && linkLabel ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-primary mt-3 inline-flex items-center gap-1 underline underline-offset-2"
        >
          {linkLabel}
          <ExternalLinkIcon size={12} aria-hidden />
        </a>
      ) : null}
    </StudioPanel>
  );
}
