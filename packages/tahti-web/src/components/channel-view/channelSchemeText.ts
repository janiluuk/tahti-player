/** Text tokens for a page painted in the channel's own colour scheme. Text
 * sitting straight on the scheme background takes the scheme's text colour
 * (`--channel-text` / `--channel-text-muted` from `colorSchemeCssVars`), so
 * a dark scheme stays readable under a light theme and the other way round.
 * Opaque theme surfaces (cards, track lists, inputs) switch back to the
 * theme's own text tokens, because their background is the theme's; the
 * zero-specificity `:where` rule only replaces the colour such a surface
 * would otherwise inherit from the page, never a text class of its own. */
export const CHANNEL_SCHEME_TEXT_CLASS = [
  '[--color-foreground:var(--channel-text)]',
  '[--color-foreground-secondary:var(--channel-text-muted)]',
  '[&_:is(.bg-background,.bg-background-secondary,.bg-background-tertiary,.bg-background-input)]:[--color-foreground:var(--foreground)]',
  '[&_:is(.bg-background,.bg-background-secondary,.bg-background-tertiary,.bg-background-input)]:[--color-foreground-secondary:var(--foreground-secondary)]',
  '[:where(&)_:where(.bg-background,.bg-background-secondary,.bg-background-tertiary,.bg-background-input)]:[color:var(--color-foreground)]',
].join(' ');
