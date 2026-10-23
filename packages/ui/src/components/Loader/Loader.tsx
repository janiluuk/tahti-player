import { LoaderCircle, LoaderPinwheel } from 'lucide-react';
import { FC } from 'react';

import { cn } from '../../utils';

const LOADER_SIZES = {
  xs: 12,
  inline: 14,
  sm: 16,
  default: 24,
  lg: 32,
  xl: 48,
} as const;

export type LoaderSize = keyof typeof LOADER_SIZES;

type LoaderProps = {
  /** A named size, or a pixel size for icon-sized slots (e.g. a play button). */
  size?: LoaderSize | number | null;
  /** `circle` is the compact spinner for buttons and inline status rows. */
  shape?: 'pinwheel' | 'circle';
  /** Announced to assistive tech; without it the spinner is decorative. */
  label?: string;
  className?: string;
  'data-testid'?: string;
};

export const Loader: FC<LoaderProps> = ({
  size,
  shape = 'pinwheel',
  label,
  className,
  'data-testid': dataTestId = 'loader',
}) => {
  const Icon = shape === 'circle' ? LoaderCircle : LoaderPinwheel;
  return (
    <Icon
      size={typeof size === 'number' ? size : LOADER_SIZES[size ?? 'default']}
      className={cn(
        'shrink-0 animate-spin motion-reduce:animate-none',
        className,
      )}
      data-testid={dataTestId}
      {...(label
        ? { role: 'status', 'aria-label': label }
        : { 'aria-hidden': true })}
    />
  );
};

export const CenteredLoader: FC<LoaderProps> = (props) => (
  <div className="flex flex-1 items-center justify-center">
    <Loader {...props} />
  </div>
);
