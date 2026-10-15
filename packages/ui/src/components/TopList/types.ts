import { ComponentProps } from 'react';

export type TopListEntry = {
  id: string;
  label: string;
  sublabel?: string;
  imageUrl?: string | null;
  value: number;
  /** When set, the row is activatable (play / navigate). */
  onClick?: () => void;
};

export type TopListProps = ComponentProps<'div'> & {
  title?: string;
  /** Heading level of the title, to fit the page's outline. Defaults to 3. */
  headingLevel?: 2 | 3 | 4;
  entries: TopListEntry[];
  formatValue: (value: number) => string;
};
