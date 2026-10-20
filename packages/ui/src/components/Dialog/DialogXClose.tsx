import { XIcon } from 'lucide-react';
import { FC } from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';
import { Tooltip } from '../Tooltip';
import { useDialogContext } from './context';

type DialogXCloseProps = {
  className?: string;
};

export const DialogXClose: FC<DialogXCloseProps> = ({ className }) => {
  const { onClose } = useDialogContext();

  return (
    <Tooltip
      content="Close"
      side="top"
      wrapperClassName="absolute top-3 right-3 z-30"
    >
      <Button
        variant="text"
        size="icon-sm"
        onClick={onClose}
        className={cn(className)}
        aria-label="Close"
        data-testid="dialog-x-close"
      >
        <XIcon size={16} />
      </Button>
    </Tooltip>
  );
};
