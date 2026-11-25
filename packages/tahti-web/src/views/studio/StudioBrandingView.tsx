import { FC } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { ButtonLink } from '@tahti-player/ui';

import { ChannelDesigner } from '../../components/ChannelDesigner';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { StudioPanel } from '../../components/StudioPanel';
import { GallerySection } from './branding/GallerySection';
import { PressKitSection } from './branding/PressKitSection';
import { ProfileLogoSection } from './branding/ProfileLogoSection';
import { usePressKit } from './branding/usePressKit';

export type StudioBrandingSection =
  | 'branding'
  | 'gallery'
  | 'press-kit'
  | 'gallery-and-press-kit'
  | 'channel-designer';

export const StudioBrandingPanel: FC<{
  section: StudioBrandingSection;
}> = ({ section }) => {
  const { t } = useTranslation('web');
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
  const showGallery =
    section === 'gallery' || section === 'gallery-and-press-kit';
  const showPressKit =
    section === 'press-kit' || section === 'gallery-and-press-kit';

  return (
    <div className="flex flex-col gap-6">
      {section === 'branding' ? (
        <ProfileLogoSection
          logoUrl={profile?.logoUrl ?? null}
          logoPlacement={profile?.logoPlacement ?? null}
          onChange={(logo) =>
            kit.setProfile((current) =>
              current ? { ...current, ...logo } : current,
            )
          }
        />
      ) : null}
      {section === 'channel-designer' ? (
        profile ? (
          <>
            <ChannelDesigner
              displayName={profile.displayName}
              username={profile.username}
              channelSlug={user?.channel?.slug}
              avatarUrl={avatarUrl}
              bio={profile.bio}
            />
            <StudioPanel
              title={t('studioBrandingView.programmeTitle')}
              help={t('studioBrandingView.programmeHint')}
              action={
                <ButtonLink
                  to="/studio/channel/$section"
                  params={{ section: 'settings' }}
                  size="sm"
                  variant="secondary"
                  data-testid="channel-designer-programme-link"
                >
                  {t('studioBrandingView.openProgramme')}
                </ButtonLink>
              }
            />
          </>
        ) : (
          <StudioPanel title={t('studioBrandingView.channelDesigner')}>
            <p className="text-foreground-secondary text-sm">
              {t('studioBrandingView.signInToDesignYour')}
            </p>
          </StudioPanel>
        )
      ) : null}

      {showGallery ? <GallerySection kit={kit} /> : null}

      {showPressKit ? (
        <div id="press-kit" className="flex scroll-mt-4 flex-col gap-6">
          <PressKitSection kit={kit} />
        </div>
      ) : null}
      <ConfirmDialog
        destructive
        isOpen={pendingReplaceUpload !== null}
        title={t('studioBranding.replaceGalleryTitle', {
          count: images.length,
        })}
        description={t('studioBranding.replaceGalleryDescription')}
        confirmLabel={t('studioBranding.replaceConfirm')}
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
        destructive
        isOpen={pendingImageDeleteId !== null}
        title={t('studioBranding.removeImageTitle')}
        description={t('studioBranding.removeImageDescription')}
        confirmLabel={t('studioBranding.removeImageConfirm')}
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
