import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FC } from 'react';

import { Button } from './Button';
import { Tooltip } from './Tooltip';
import { useUiLabels } from './UiLabels';

type TopBarNavigationProps = {
  onBack?: () => void;
  onForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
};

export const TopBarNavigation: FC<TopBarNavigationProps> = ({
  onBack,
  onForward,
  canGoBack = true,
  canGoForward = true,
}) => {
  const labels = useUiLabels();
  return (
    <div className="flex flex-row items-center gap-2">
      <Tooltip content={labels.back} side="top">
        <Button
          size="icon-sm"
          disabled={!canGoBack}
          onClick={onBack}
          aria-label={labels.back}
        >
          <ChevronLeft size={16} />
        </Button>
      </Tooltip>
      <Tooltip content={labels.forward} side="top">
        <Button
          size="icon-sm"
          disabled={!canGoForward}
          onClick={onForward}
          aria-label={labels.forward}
        >
          <ChevronRight size={16} />
        </Button>
      </Tooltip>
    </div>
  );
};
