import { useSearch } from '@tanstack/react-router';
import {
  DownloadIcon,
  ImagesIcon,
  PaintbrushIcon,
  PaletteIcon,
} from 'lucide-react';
import { FC, useEffect, useState } from 'react';

import { TabLabel, Tabs } from '@tahti-player/ui';

import { ChannelDesigner } from '../../components/ChannelDesigner';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { StudioPanel } from '../../components/StudioPanel';
import { useSettingsModalStore } from '../../stores/settingsModalStore';
import { GallerySection } from './branding/GallerySection';
import { PressKitSection } from './branding/PressKitSection';
import { ProfilePictureSection } from './branding/ProfilePictureSection';
import { usePressKit } from './branding/usePressKit';

export const STUDIO_BRANDING_SECTIONS = [
  'branding',
  'gallery',
  'press-kit',
  'channel-designer',
] as const;

export type StudioBrandingSection = (typeof STUDIO_BRANDING_SECTIONS)[number];

export function isStudioBrandingSection(
  value: string | undefined,
): value is StudioBrandingSection {
  return STUDIO_BRANDING_SECTIONS.some((section) => section === value);
}

export const StudioBrandingPanel: FC<{
  section?: StudioBrandingSection;
  hideSectionNav?: boolean;
  onSectionChange?: (section: StudioBrandingSection) => void;
}> = ({ section, hideSectionNav = section != null, onSectionChange }) => {
  const kit = usePressKit();
  const {
    user,
    profile,
    images,
    avatarUrl,
    pendingReplaceUpload,
    setPendingReplaceUpload,
    applyGalleryUpload,
    pendingImageDeleteId,
    setPendingImageDeleteId,
    removeImage,
  } = kit;
  const [tab, setTab] = useState<StudioBrandingSection>(section ?? 'branding');

  useEffect(() => {
    if (section) {
      setTab(section);
    }
  }, [section]);

  const selectSection = (next: StudioBrandingSection) => {
    setTab(next);
    onSectionChange?.(next);
  };

  return (
    <div className="flex flex-col gap-6">
      {hideSectionNav ? null : (
        <Tabs.Root
          selectedIndex={Math.max(0, STUDIO_BRANDING_SECTIONS.indexOf(tab))}
          onChange={(index) => {
            const next = STUDIO_BRANDING_SECTIONS[index];
            if (next) {
              selectSection(next);
            }
          }}
        >
          <Tabs.List className="w-fit flex-wrap">
            {(
              [
                ['branding', 'Branding', PaletteIcon],
                ['gallery', 'Gallery', ImagesIcon],
                ['press-kit', 'Press kit', DownloadIcon],
                ['channel-designer', 'Channel Designer', PaintbrushIcon],
              ] as const
            ).map(([id, label, Icon]) => (
              <Tabs.Tab key={id}>
                <TabLabel icon={<Icon size={15} />}>{label}</TabLabel>
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.Root>
      )}

      {tab === 'branding' ? <ProfilePictureSection kit={kit} /> : null}
      {tab === 'channel-designer' ? (
        profile ? (
          <ChannelDesigner
            displayName={profile.displayName}
            username={profile.username}
            channelSlug={user?.channel?.slug}
            avatarUrl={avatarUrl}
            bio={profile.bio}
          />
        ) : (
          <StudioPanel title="Channel Designer">
            <p className="text-foreground-secondary text-sm">
              Sign in to design your public channel.
            </p>
          </StudioPanel>
        )
      ) : null}

      {tab === 'gallery' ? <GallerySection kit={kit} /> : null}

      {tab === 'press-kit' ? <PressKitSection kit={kit} /> : null}
      <ConfirmDialog
        isOpen={pendingReplaceUpload !== null}
        title={`Replace all ${images.length} existing gallery images?`}
        description="This upload replaces every current gallery photo."
        confirmLabel="Replace"
        onCancel={() => setPendingReplaceUpload(null)}
        onConfirm={() => {
          const pending = pendingReplaceUpload;
          setPendingReplaceUpload(null);
          if (!pending) {
            return;
          }
          void applyGalleryUpload(pending.files, pending.includeInZip);
        }}
      />
      <ConfirmDialog
        isOpen={pendingImageDeleteId !== null}
        title="Remove this image from your gallery?"
        description="It will no longer appear in your public press kit or the downloadable zip."
        confirmLabel="Remove image"
        onCancel={() => setPendingImageDeleteId(null)}
        onConfirm={() => {
          const id = pendingImageDeleteId;
          setPendingImageDeleteId(null);
          if (!id) {
            return;
          }
          void removeImage(id);
        }}
      />
    </div>
  );
};

export const StudioBrandingView: FC = () => {
  const open = useSettingsModalStore((state) => state.open);
  const search = useSearch({ strict: false }) as { tab?: string };
  const section = isStudioBrandingSection(search.tab) ? search.tab : 'branding';

  useEffect(() => {
    if (section === 'channel-designer') {
      open('channel');
      return;
    }
    open('artist', undefined, section);
  }, [open, section]);

  return null;
};
