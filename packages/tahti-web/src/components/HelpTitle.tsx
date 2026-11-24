import type { ReactNode } from 'react';

import { HelpTip, useUiLabels } from '@tahti-player/ui';

/** A field or sub-section title with its explanation behind a help icon,
 * in place of a help paragraph under the title. */
export function HelpTitle({
  title,
  help,
  as: Tag = 'h3',
  id,
  className = '',
  titleClassName = 'text-foreground text-sm font-semibold',
  children,
}: {
  title: string;
  help: string;
  as?: 'h2' | 'h3' | 'span';
  id?: string;
  className?: string;
  titleClassName?: string;
  /** Extra content after the help icon, e.g. a badge. */
  children?: ReactNode;
}) {
  const labels = useUiLabels();
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Tag id={id} className={titleClassName}>
        {title}
      </Tag>
      <HelpTip label={labels.aboutNamed(title)} content={help} />
      {children}
    </div>
  );
}
