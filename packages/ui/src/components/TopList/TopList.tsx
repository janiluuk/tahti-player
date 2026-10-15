import { FC } from 'react';

import { cn } from '../../utils';
import { TopListRow } from './TopListRow';
import type { TopListProps } from './types';

export const TopList: FC<TopListProps> = ({
  title,
  headingLevel = 3,
  entries,
  formatValue,
  className,
  ...props
}) => {
  const maxValue = Math.max(...entries.map((entry) => entry.value));
  const Heading = `h${headingLevel}` as const;

  return (
    <div className={cn('flex flex-col gap-3', className)} {...props}>
      {title ? (
        <Heading className="font-heading text-xl">{title}</Heading>
      ) : null}
      <div>
        {entries.map((entry, index) => (
          <TopListRow
            key={entry.id}
            entry={entry}
            rank={index + 1}
            fillRatio={entry.value / maxValue}
            formatValue={formatValue}
          />
        ))}
      </div>
    </div>
  );
};
