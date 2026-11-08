import { useTranslation } from '@tahti-player/i18n';
import { Tooltip } from '@tahti-player/ui';

import type {
  ChannelVisual,
  ColorScheme,
  VisualPreset,
} from '../../api/channel-design';
import type { ChannelGalleryMode } from '../../api/channel-gallery';
import type { ChannelPageItem } from '../../lib/channelPageLayout';
import { ChannelBackdropCard } from '../ChannelBackdropCard';
import { PreviewTracksPlaceholder } from './PreviewTracksPlaceholder';

type Props = {
  displayName: string;
  username: string;
  channelSlug?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  layout?: ChannelPageItem[];
  visual: ChannelVisual;
  previewStyle: {
    accent: string;
    highlight: string;
    bg: string;
    fg: string;
    gradient: string;
  };
  previewVideoUrl: string;
  showHeaderVideo: boolean;
  headerBackdropIsImage: boolean;
  previewPreset: VisualPreset;
  scheme: ColorScheme;
  galleryMode: ChannelGalleryMode;
  galleryImageList: string[];
  slideshowPreset: string;
  slideshowInterval: number;
  slideshowTransition: number;
  slideshowAutoplay: boolean;
  mountVisualizer: boolean;
  highlightSection: 'header' | 'visualizer' | null;
  onEditBackdrop: () => void;
  onEditPlayer: () => void;
};

/** The "Live page preview" stage: mirrors the public channel structure so
 * clicking the header or player jumps to its controls. */
export function ChannelPagePreview({
  displayName,
  username,
  channelSlug,
  avatarUrl,
  bio,
  layout,
  visual,
  previewStyle,
  previewVideoUrl,
  showHeaderVideo,
  headerBackdropIsImage,
  previewPreset,
  scheme,
  galleryMode,
  galleryImageList,
  slideshowPreset,
  slideshowInterval,
  slideshowTransition,
  slideshowAutoplay,
  mountVisualizer,
  highlightSection,
  onEditBackdrop,
  onEditPlayer,
}: Props) {
  const { t } = useTranslation('web');
  return (
    <section
      aria-label={t('channelPagePreview.channelPagePreview')}
      className="border-border bg-background min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border shadow-lg lg:max-h-[calc(100vh-7rem)]"
    >
      <div className="border-border bg-background-secondary/40 flex items-center gap-1.5 border-b px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
            {t('channelPagePreview.livePagePreview')}
          </span>
          <Tooltip
            side="bottom"
            content={
              <p className="max-w-64 text-xs leading-relaxed">
                {t('channelPagePreview.thisMirrorsThePublicChannel')}
              </p>
            }
          >
            <span
              tabIndex={0}
              role="img"
              aria-label={t('channelPagePreview.aboutThisPreview')}
              className="text-foreground-secondary hover:text-foreground inline-flex size-4 cursor-help items-center justify-center rounded-full border border-current"
            >
              <span className="text-[10px] leading-none font-bold">?</span>
            </span>
          </Tooltip>
        </div>
      </div>
      <ChannelBackdropCard
        minHeightClassName="min-h-[14rem]"
        displayName={displayName}
        username={username}
        channelSlug={channelSlug}
        avatarUrl={avatarUrl}
        bio={bio}
        avatarVisible={
          layout?.find((i) => i.type === 'avatar')?.visible ?? true
        }
        bioVisible={layout?.find((i) => i.type === 'about')?.visible ?? true}
        subscribeVisible={
          layout?.find((i) => i.type === 'subscribe')?.visible ?? false
        }
        headerStyle={visual.headerStyle}
        topBarText={visual.topBarText}
        videoBackgroundUrl={previewVideoUrl}
        showVideoOverride={showHeaderVideo}
        isImageOverride={headerBackdropIsImage}
        accent={previewStyle.accent}
        highlight={previewStyle.highlight}
        bg={previewStyle.bg}
        fg={previewStyle.fg}
        gradientOverride={previewStyle.gradient}
        visualPreset={previewPreset}
        colorScheme={scheme}
        artworkUrl={avatarUrl}
        galleryMode={galleryMode}
        slideshowImages={galleryImageList}
        slideshowPreset={slideshowPreset}
        slideshowIntervalSeconds={slideshowInterval}
        slideshowTransitionMs={slideshowTransition}
        slideshowAutoplay={slideshowAutoplay}
        mountVisualizer={mountVisualizer}
        editable
        identitySelected={highlightSection === 'header'}
        backgroundSelected={false}
        navItems={[]}
        onEditIdentity={onEditBackdrop}
        badge={
          <span
            className="rounded px-2 py-1 text-[10px] font-bold tracking-wide uppercase"
            style={{
              background: previewStyle.accent,
              color: '#0B1220',
            }}
          >
            {t('channelPagePreview.artistChannel')}
          </span>
        }
      />
      <Tooltip content={t('channelPagePreview.editPlayerDesign')} side="top">
        <div
          role="button"
          tabIndex={0}
          data-testid="channel-designer-stage-player"
          aria-label={t('channelPagePreview.editPlayerDesign')}
          onClick={onEditPlayer}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onEditPlayer();
            }
          }}
          className={`border-border cursor-pointer overflow-hidden border border-y-0 outline-none ${
            highlightSection === 'visualizer'
              ? 'ring-primary ring-2 ring-inset'
              : ''
          }`}
        >
          <div className="bg-gradient-to-t from-black/85 via-black/45 to-black/10 p-4 pt-10">
            <div className="text-[10px] font-semibold tracking-wide text-white/70 uppercase">
              {t('channelPagePreview.nowPlaying')}
            </div>
            <div className="mt-1 text-2xl font-extrabold text-white">
              {t('channelPagePreview.yourLiveChannel')}
            </div>
            <div className="text-sm text-white/80">
              {t('channelPagePreview.aLivePreviewOfThe')}
            </div>
          </div>
        </div>
      </Tooltip>
      <nav
        aria-label={t('channelPagePreview.channelNavigation')}
        className="border-border relative flex flex-wrap items-center gap-x-5 gap-y-2 border border-t-0 px-4 py-3 text-xs font-semibold uppercase"
      >
        <span className="border-primary border-b-2 pb-2">
          {t('channelPagePreview.stage')}
        </span>
        <span className="text-foreground-secondary pb-2">
          {t('channelPagePreview.tracks')}
        </span>
        <span className="text-foreground-secondary pb-2">
          {t('channelPagePreview.about')}
        </span>
      </nav>

      <PreviewTracksPlaceholder displayName={displayName} bio={bio} />
    </section>
  );
}
