import { DialogTitle as HeadlessDialogTitle } from '@headlessui/react';
import { FC, PropsWithChildren } from 'react';

import { cn } from '../../utils';

export const DialogTitle: FC<PropsWithChildren<{ className?: string }>> = ({
  children,
  className,
}) => (
  <HeadlessDialogTitle
    className={cn('text-foreground text-lg font-bold', className)}
  >
    {children}
  </HeadlessDialogTitle>
);
