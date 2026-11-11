import { Fragment, type ReactNode } from 'react';

/** Renders a translated string, wrapping each `backtick-quoted` part in `<code>`. */
export function withInlineCode(text: string): ReactNode {
  return text
    .split('`')
    .map((part, index) =>
      index % 2 === 1 ? (
        <code key={index}>{part}</code>
      ) : (
        <Fragment key={index}>{part}</Fragment>
      ),
    );
}
