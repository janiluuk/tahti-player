import { Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { TabLabel, Tabs } from '@tahti-player/ui';

import type { PublicPressKitImage } from '../../api/artist-settings';
import { ArtistGalleryAddIcon } from '../../components/ArtistGalleryPanel';
import { ChannelDesigner } from '../../components/ChannelDesigner';

export type ArtistProfileTab = 'stage' | 'gallery' | 'design';

export type ArtistProfileTabItem = {
  id: ArtistProfileTab;
  label: string;
  icon: LucideIcon;
};

export function ArtistProfileTabRow({
  tabs,
  tab,
  onTabChange,
  galleryError,
  hasGalleryImages,
  showGalleryAdd,
  onGalleryCreated,
}: {
  tabs: ArtistProfileTabItem[];
  tab: ArtistProfileTab;
  onTabChange: (tab: ArtistProfileTab) => void;
  galleryError: string | null;
  hasGalleryImages: boolean;
  showGalleryAdd: boolean;
  onGalleryCreated: (images: PublicPressKitImage[]) => void;
}) {
  const { t } = useTranslation('web');
  return (
    <div className="border-border flex flex-wrap items-center gap-2 border-b pb-3">
      {tabs.length > 0 ? (
        <Tabs.Root
          selectedIndex={Math.max(
            0,
            tabs.findIndex((item) => item.id === tab),
          )}
          onChange={(index) => {
            const next = tabs[index];
            if (next) {
              onTabChange(next.id);
            }
          }}
        >
          <Tabs.List className="w-fit flex-wrap">
            {tabs.map((item) => (
              <Tabs.Tab key={item.id}>
                <TabLabel icon={<item.icon size={14} />}>{item.label}</TabLabel>
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.Root>
      ) : null}
      {galleryError && !hasGalleryImages ? (
        <p className="text-foreground-secondary text-xs" role="status">
          {t('artistProfilePageBatch30.couldNotLoadGallery', {
            error: galleryError,
          })}
        </p>
      ) : null}
      {showGalleryAdd ? (
        <ArtistGalleryAddIcon onCreated={onGalleryCreated} />
      ) : null}
    </div>
  );
}

type DesignerProps = ComponentProps<typeof ChannelDesigner>;

export function ArtistDesignTab({
  artist,
  channelSlug,
  onLookVisibilityChange,
  onSaved,
}: {
  artist: {
    displayName: string;
    username: string;
    avatarUrl?: string | null;
    bio?: string | null;
  };
  channelSlug?: string;
  onLookVisibilityChange: DesignerProps['onLookVisibilityChange'];
  onSaved: DesignerProps['onSaved'];
}) {
  const { t } = useTranslation('web');
  return (
    <div className="flex flex-col gap-3">
      {channelSlug ? (
        <p className="text-foreground-secondary text-sm">
          {t('artistProfilePageBatch30.fullLayoutEditingLivesOn')}{' '}
          <Link
            to="/channel/$slug"
            params={{ slug: channelSlug }}
            search={{ edit: true }}
            className="underline-offset-2 hover:underline"
          >
            {t('artistProfilePageBatch30.channelPage')}
          </Link>
          {t('artistProfilePageBatch30.fullLayoutEditingEnd')}
        </p>
      ) : null}
      <ChannelDesigner
        displayName={artist.displayName}
        username={artist.username}
        channelSlug={channelSlug}
        avatarUrl={artist.avatarUrl}
        bio={artist.bio}
        compact
        onLookVisibilityChange={onLookVisibilityChange}
        onSaved={onSaved}
      />
    </div>
  );
}
