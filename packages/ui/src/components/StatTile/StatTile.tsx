import { ComponentProps, FC, ReactNode } from 'react';

import { cn } from '../../utils';

type StatTileProps = ComponentProps<'div'> & {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
};

/**
 * A stacked value+label(+sublabel) block for a stats grid — distinct from
 * `StatChip`'s compact inline icon+value+label pill.
 */
export const StatTile: FC<StatTileProps> = ({
  label,
  value,
  sublabel,
  className,
  ...props
}) => (
  <div
    className={cn(
      'border-border bg-background-secondary/35 rounded-lg border p-3',
      className,
    )}
    {...props}
  >
    <p className="text-foreground-secondary text-xs uppercase">{label}</p>
    <p className="mt-1 text-2xl font-bold">{value}</p>
    {sublabel && (
      <p className="text-foreground-secondary text-xs">{sublabel}</p>
    )}
  </div>
);
