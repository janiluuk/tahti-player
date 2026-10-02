import { Badge } from '@tahti-player/ui';

import { contrastingText } from '../lib/colorScheme';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** Coloured pill beside a display name. Without a valid `color` it uses
 * `fallbackColor` (the page accent), or the theme accent when there's none. */
export function Nameplate({
  text,
  color,
  fallbackColor,
}: {
  text?: string | null;
  color?: string | null;
  fallbackColor?: string | null;
}) {
  const label = text?.trim();
  if (!label) {
    return null;
  }
  const background = color && HEX_COLOR.test(color) ? color : fallbackColor;
  if (!background) {
    return (
      <Badge variant="pill" color="cyan" data-testid="nameplate">
        {label}
      </Badge>
    );
  }
  return (
    <Badge
      variant="pill"
      color="secondary"
      className="border-transparent"
      style={{
        backgroundColor: background,
        color: contrastingText(background),
      }}
      data-testid="nameplate"
    >
      {label}
    </Badge>
  );
}
