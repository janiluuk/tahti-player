import { ExternalLink } from '@tahti-player/ui';

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
        <ExternalLink href={href} showIcon className="text-primary mt-3">
          {linkLabel}
        </ExternalLink>
      ) : null}
    </StudioPanel>
  );
}
