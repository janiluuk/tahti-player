import { PopoverButton } from '@headlessui/react';
import { FC, Fragment, ReactElement } from 'react';

import { Tooltip, TooltipProps } from '../Tooltip/Tooltip';

export type PopoverTooltip = Pick<TooltipProps, 'content' | 'side'>;

export const ClickTrigger: FC<{
  children: ReactElement;
  tooltip?: PopoverTooltip;
}> = ({ children, tooltip }) => {
  const button = <PopoverButton as={Fragment}>{children}</PopoverButton>;
  return tooltip ? <Tooltip {...tooltip}>{button}</Tooltip> : button;
};
