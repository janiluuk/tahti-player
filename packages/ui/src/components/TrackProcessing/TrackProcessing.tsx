import { cva, VariantProps } from 'class-variance-authority';
import { FC } from 'react';

import { cn } from '../../utils';
import { Loader } from '../Loader';

const trackProcessingVariants = cva(
  'text-foreground-secondary flex items-center gap-1.5 font-medium',
  {
    variants: {
      variant: {
        inline: 'inline-flex text-xs',
        overlay:
          'absolute inset-0 flex-col justify-center gap-1 bg-black/55 text-[11px] text-white',
        waveform:
          'border-border bg-background-secondary/60 relative h-14 w-full justify-center overflow-hidden rounded-md border-(length:--border-width) border-dashed text-sm',
      },
    },
    defaultVariants: {
      variant: 'inline',
    },
  },
);

const iconSize = { inline: 14, overlay: 18, waveform: 18 } as const;

type TrackProcessingProps = {
  label?: string;
  /** Visual only (no status role) — for a second indicator beside one that
   * already announces. */
  decorative?: boolean;
  className?: string;
} & VariantProps<typeof trackProcessingVariants>;

/** A track that is still being processed (just uploaded, waveform not ready,
 * or re-processing after an edit): spinner + "Processing". */
export const TrackProcessing: FC<TrackProcessingProps> = ({
  variant = 'inline',
  label = 'Processing',
  decorative = false,
  className,
}) => (
  <span
    {...(decorative
      ? { 'aria-hidden': true }
      : { role: 'status', 'aria-live': 'polite' as const })}
    data-testid="track-processing"
    className={cn(trackProcessingVariants({ variant }), className)}
  >
    {variant === 'waveform' && (
      <span
        aria-hidden
        className="bg-foreground/5 absolute inset-0 animate-pulse motion-reduce:animate-none"
      />
    )}
    <Loader
      shape="circle"
      size={iconSize[variant ?? 'inline']}
      className="relative"
    />
    {label ? <span className="relative">{label}</span> : null}
  </span>
);
