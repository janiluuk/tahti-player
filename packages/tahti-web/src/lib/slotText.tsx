import { Fragment, type ReactNode } from 'react';

/** Placeholder value to pass as an interpolation so `withSlot` can put a
 * React node (a link, a bold name) where the translation has it. */
export const SLOT = '\u0001';

export function withSlot(text: string, node: ReactNode): ReactNode {
  const index = text.indexOf(SLOT);
  if (index < 0) {
    return text;
  }
  return (
    <Fragment>
      {text.slice(0, index)}
      {node}
      {text.slice(index + SLOT.length)}
    </Fragment>
  );
}
