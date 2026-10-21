import { XIcon } from 'lucide-react';
import { FC, type MouseEvent } from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';
import { useDialogContext } from './context';

type DialogXCloseProps = {
  className?: string;
};

export const DialogXClose: FC<DialogXCloseProps> = ({ className }) => {
  const { onClose } = useDialogContext();

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onClose();
  };

  return (
    <Button
      variant="text"
      size="icon-sm"
      onClick={handleClick}
      onMouseDown={(event) => event.stopPropagation()}
      className={cn(
        'pointer-events-auto absolute top-3 right-3 z-[100]',
        className,
      )}
      aria-label="Close"
      data-testid="dialog-x-close"
    >
      <XIcon size={16} />
    </Button>
  );
};
