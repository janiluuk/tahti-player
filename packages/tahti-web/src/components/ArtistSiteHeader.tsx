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
  const mainLink = (
    <a
      href="https://tahti.live/"
      className="shrink-0 rounded px-2 py-1 text-sm underline underline-offset-4 focus-visible:outline-2"
    >
      tahti.live
    </a>
  );
  if (hidden) {
    return (
      <footer
        className="order-last flex shrink-0 justify-end px-3 py-1"
        style={{ backgroundColor: scheme.bg, color: scheme.text }}
      >
        {menu}
        {mainLink}
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
      {mainLink}
    </header>
  );
}
