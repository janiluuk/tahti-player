import { ComponentProps, FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { statToneClasses, type StatTone } from './statTones';

type StatTileProps = ComponentProps<'div'> & {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  /** Colour identity of this metric, shown as the left edge and icon chip. */
  tone?: StatTone;
  icon?: ReactNode;
};

/**
 * A stacked value+label(+sublabel) block for a stats grid — distinct from
 * `StatChip`'s compact inline icon+value+label pill.
 */
export const StatTile: FC<StatTileProps> = ({
  label,
  value,
  sublabel,
  tone,
  icon,
  className,
  ...props
}) => {
  const toneClasses = tone ? statToneClasses[tone] : undefined;
  const labelElement = (
    <p className="text-foreground-secondary text-xs uppercase">{label}</p>
  );
  return (
    <div
      className={cn(
        'border-border bg-background-secondary/35 rounded-lg border p-3',
        toneClasses && ['border-l-4', toneClasses.edge],
        className,
      )}
      data-tone={tone}
      {...props}
    >
      {icon ? (
        <div className="flex items-start justify-between gap-2">
          {labelElement}
          <span
            aria-hidden
            data-testid="stat-tile-icon"
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-md',
              toneClasses?.chip ??
                'bg-background-secondary text-foreground-secondary',
            )}
          >
            {icon}
          </span>
        </div>
      ) : (
        labelElement
      )}
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sublabel && (
        <p className="text-foreground-secondary text-xs">{sublabel}</p>
      )}
    </div>
  );
};
