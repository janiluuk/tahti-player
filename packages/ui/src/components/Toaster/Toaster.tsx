import { FC } from 'react';
import { Toaster as SonnerToaster } from 'sonner';

type ToasterProps = {
  position?:
    | 'top-left'
    | 'top-right'
    | 'top-center'
    | 'bottom-left'
    | 'bottom-right'
    | 'bottom-center';
  richColors?: boolean;
  expand?: boolean;
  closeButton?: boolean;
};

const ToasterImpl: FC<ToasterProps> = ({
  position = 'bottom-right',
  richColors = false,
  expand = false,
  closeButton = false,
}) => {
  return (
    <SonnerToaster
      style={{ fontFamily: 'inherit', overflowWrap: 'anywhere' }}
      position={position}
      richColors={richColors}
      expand={expand}
      closeButton={closeButton}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'bg-background text-foreground border-border border-(length:--border-width) shadow-shadow rounded-md text-sm flex items-start gap-3 p-3.5 w-[min(22rem,calc(100vw-2rem))] select-none [&_[data-content]]:min-w-0 [&_[data-content]]:flex-1 [&_[data-title]]:font-semibold [&_[data-title]]:leading-snug',
          description:
            'text-foreground-secondary mt-0.5 font-normal leading-snug',
          actionButton:
            'h-8 shrink-0 rounded-md border-(length:--border-width) border-border bg-primary px-2.5 text-xs font-semibold text-primary-foreground',
          cancelButton:
            'h-8 shrink-0 rounded-md border-(length:--border-width) border-border bg-background-secondary px-2.5 text-xs font-semibold text-foreground',
          loading:
            '[&[data-sonner-toast]_[data-icon]]:flex [&[data-sonner-toast]_[data-icon]]:size-4 [&[data-sonner-toast]_[data-icon]]:relative [&[data-sonner-toast]_[data-icon]]:justify-start [&[data-sonner-toast]_[data-icon]]:items-center [&[data-sonner-toast]_[data-icon]]:flex-shrink-0',
          success:
            '!bg-accent-green !text-foreground !border-(length:--border-width) !border-border',
          error:
            '!bg-accent-red !text-foreground !border-(length:--border-width) !border-border',
          warning:
            '!bg-accent-orange !text-foreground !border-(length:--border-width) !border-border',
          info: '!bg-accent-cyan !text-foreground !border-(length:--border-width) !border-border',
        },
      }}
    />
  );
};

export const Toaster = ToasterImpl;
