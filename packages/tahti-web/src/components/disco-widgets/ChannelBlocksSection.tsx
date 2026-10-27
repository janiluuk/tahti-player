import { MediaArtwork } from '@tahti-player/ui';

import type {
  ChannelBlockWidth,
  PublicChannelBlock,
} from '../../api/channel-blocks';
import { packChannelBlocks } from '../../lib/channelBlockLayout';
import { cn } from '../../lib/cn';
import { DiscoWidgetFrame } from './DiscoWidgetFrame';

const WIDTH_CLASS: Record<ChannelBlockWidth, string> = {
  FULL: '@2xl:col-span-6',
  HALF: '@2xl:col-span-3',
  THIRD: '@2xl:col-span-2',
};

/** The artist's channel layout: logos and add-ons in rows of full, half and
 * third widths. Narrow columns stack every block full width. */
export function ChannelBlocksSection({
  blocks,
}: {
  blocks: PublicChannelBlock[];
}) {
  const rows = packChannelBlocks(blocks);
  if (rows.length === 0) {
    return null;
  }
  return (
    <section
      aria-label="Channel blocks"
      className="@container flex w-full flex-col gap-3"
      data-testid="channel-blocks"
    >
      {rows.map((row) => (
        <div
          key={row.map((block) => block.id).join('-')}
          className="grid grid-cols-1 gap-3 @2xl:grid-cols-6"
          data-testid="channel-block-row"
        >
          {row.map((block) => (
            <div
              key={block.id}
              className={cn('min-w-0', WIDTH_CLASS[block.width])}
              data-testid="channel-block"
              data-width={block.width}
            >
              {block.type === 'LOGO' && block.logoUrl ? (
                <div className="relative aspect-[3/1] w-full">
                  <MediaArtwork
                    src={block.logoUrl}
                    alt="Channel logo"
                    size="fill"
                    fit="contain"
                    imageReveal={false}
                  />
                </div>
              ) : block.addon ? (
                <DiscoWidgetFrame
                  sandboxUrl={block.addon.sandboxUrl}
                  name={block.addon.name}
                  context={block.addon.context}
                  config={block.addon.config}
                />
              ) : null}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
