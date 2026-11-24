import { MenuIcon } from 'lucide-react';

import { Button } from '@tahti-player/ui';

import {
  normalizeColorScheme,
  type LooseColorScheme,
} from '../lib/colorScheme';

type Props = {
  title?: string | null;
  artistName?: string;
  colorScheme?: LooseColorScheme;
  hidden?: boolean;
  onOpenMenu?: () => void;
  menuLabel?: string;
};

export function ArtistSiteHeader({
  title,
  artistName,
  colorScheme,
  hidden,
  onOpenMenu,
  menuLabel = 'Open navigation',
}: Props) {
  const scheme = normalizeColorScheme(colorScheme);
  const menu = onOpenMenu ? (
    <Button
      variant="text"
      size="icon-sm"
      aria-label={menuLabel}
      onClick={onOpenMenu}
    >
      <MenuIcon size={18} />
    </Button>
  ) : null;
  if (hidden) {
    if (!menu) {
      return null;
    }
    return (
      <footer
        className="order-last flex shrink-0 justify-end px-3 py-1"
        style={{ backgroundColor: scheme.bg, color: scheme.text }}
      >
        {menu}
      </footer>
    );
  }
  return (
    <header
      data-testid="artist-site-header"
      className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b px-4 sm:px-6"
      style={{
        backgroundColor: scheme.bg,
        color: scheme.text,
        borderColor: scheme.accent,
      }}
    >
      {menu}
      <span className="min-w-0 truncate font-semibold">
        {title?.trim() || artistName}
      </span>
    </header>
  );
}
