/** Tells screen reader users a link opens a new tab; sighted users get the
 * browser's own cue or an external-link icon. */
export function NewTabHint() {
  return <span className="sr-only"> (opens in a new tab)</span>;
}
