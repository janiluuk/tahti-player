import {
  Heart,
  ListMusic,
  Newspaper,
  SettingsIcon,
  Youtube,
} from 'lucide-react';
import { type ReactNode } from 'react';

import { Box, Button, Tooltip } from '@tahti-player/ui';

import { cn } from '../../lib/cn';
import { NEWS_WIDGET_TYPE_ID } from '../../stores/listenerWidgetsStore';
import { SourceServiceIcon } from '../SourceServiceIcon';

export function ConfigureGear({
  title,
  open,
  onToggle,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Tooltip
      content={open ? `Hide ${title} configuration` : `Configure ${title}`}
      side="top"
    >
      <Button
        size="icon-sm"
        variant="secondary"
        onClick={onToggle}
        aria-label={open ? `Hide ${title} configuration` : `Configure ${title}`}
      >
        <SettingsIcon size={15} aria-hidden />
      </Button>
    </Tooltip>
  );
}

export function ConfigurableCard({
  header,
  children,
  title,
  open,
  onOpenChange,
  className,
}: {
  /** Render the store row; pass configure gear into PluginStoreItem `accessory`
   * so compact dialogs don't overflow a side-by-side gear outside the card. */
  header: (gear: ReactNode) => ReactNode;
  children: ReactNode;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      {header(
        <ConfigureGear
          title={title}
          open={open}
          onToggle={() => onOpenChange(!open)}
        />,
      )}
      {open ? (
        <Box
          variant="tertiary"
          shadow="none"
          className="h-auto w-auto gap-4 p-3"
          data-testid={`listen-addon-config-${title}`}
        >
          {children}
        </Box>
      ) : null}
    </div>
  );
}

export function listenAddonIcon(typeId: string): ReactNode {
  if (typeId === 'favorites') {
    return <Heart className="size-6" aria-hidden />;
  }
  if (typeId === NEWS_WIDGET_TYPE_ID) {
    return <Newspaper className="size-6" aria-hidden />;
  }
  if (typeId === 'youtube') {
    return <Youtube className="size-6" aria-hidden />;
  }
  if (typeId === 'mikseri') {
    return <ListMusic className="size-6" aria-hidden />;
  }
  if (
    typeId === 'soundcloud' ||
    typeId === 'spotify' ||
    typeId === 'hearthis' ||
    typeId === 'bandcamp'
  ) {
    return <SourceServiceIcon id={typeId} />;
  }
  return undefined;
}
