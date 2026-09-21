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
  return (
    <main
      aria-label="Channel page preview"
      className="border-border bg-background min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border shadow-lg lg:max-h-[calc(100vh-7rem)]"
    >
      <div className="border-border bg-background-secondary/40 flex items-center gap-1.5 border-b px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
            Live page preview
          </span>
          <Tooltip
            side="bottom"
            content={
              <p className="max-w-64 text-xs leading-relaxed">
                This mirrors the public channel structure. Visitors see your
                profile header, channel navigation, live stage, tracks, and
                artist information in this order. Layout blocks are edited from
                the channel page editor.
              </p>
            }
          >
            <span
              tabIndex={0}
              aria-label="About this preview"
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
            Artist channel
          </span>
        }
      />
      <div
        role="button"
        tabIndex={0}
        data-testid="channel-designer-stage-player"
        aria-label="Edit player design"
        title="Edit player design"
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
            Now playing
          </div>
          <div className="mt-1 text-2xl font-extrabold text-white">
            Your live channel
          </div>
          <div className="text-sm text-white/80">
            A live preview of the artist stage
          </div>
        </div>
      </div>
      <nav
        aria-label="Channel navigation"
        className="border-border relative flex flex-wrap items-center gap-x-5 gap-y-2 border border-t-0 px-4 py-3 text-xs font-semibold uppercase"
      >
        <span className="border-primary border-b-2 pb-2">Stage</span>
        <span className="text-foreground-secondary pb-2">Tracks</span>
        <span className="text-foreground-secondary pb-2">About</span>
      </nav>

      <PreviewTracksPlaceholder displayName={displayName} bio={bio} />
    </main>
  );
}
