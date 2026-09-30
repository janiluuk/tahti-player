import { useEffect, useState, type CSSProperties } from 'react';

import { ExternalLink, MediaArtwork } from '@tahti-player/ui';

import {
  fetchChannelSoundCloudEmbeds,
  soundCloudWidgetSrc,
  type ChannelSoundCloudEmbed,
} from '../../api/channel-embeds';
import { SourceServiceIcon } from '../SourceServiceIcon';

/**
 * The artist's SoundCloud tracks. SoundCloud's widget only mounts after
 * the listener presses play, so SoundCloud never sees a visitor's IP just
 * from opening the profile.
 */
export function ArtistSoundCloudTracks({
  channelSlug,
  surfaceStyle,
}: {
  channelSlug: string;
  surfaceStyle: CSSProperties;
}) {
  const [embeds, setEmbeds] = useState<ChannelSoundCloudEmbed[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchChannelSoundCloudEmbeds(channelSlug).then((result) => {
      if (!cancelled) {
        setEmbeds(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [channelSlug]);

  if (embeds.length === 0) {
    return null;
  }

  return (
    <section
      className="flex flex-col gap-4 rounded-2xl border p-4 sm:p-6"
      style={surfaceStyle}
    >
      <div className="flex items-center gap-2">
        <div className="size-5 shrink-0 overflow-hidden rounded">
          <SourceServiceIcon id="soundcloud" />
        </div>
        <h2 className="font-display text-lg font-bold tracking-tight">
          On SoundCloud
        </h2>
      </div>
      <ul className="flex flex-col gap-3" data-testid="soundcloud-tracks">
        {embeds.map((embed) => {
          const title = embed.title ?? embed.url;
          return (
            <li key={embed.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <MediaArtwork
                  src={embed.thumbnailUrl}
                  alt=""
                  size="thumb"
                  playLabel={`Play ${title} on SoundCloud`}
                  isPlaying={openId === embed.id}
                  onPlay={() => setOpenId(embed.id)}
                />
                <div className="min-w-0 flex-1 text-sm">
                  <ExternalLink
                    href={embed.url}
                    className="block truncate font-semibold no-underline"
                  >
                    {title}
                  </ExternalLink>
                  {embed.authorName ? (
                    <span className="text-foreground-secondary block truncate text-xs">
                      {embed.authorName}
                    </span>
                  ) : null}
                </div>
              </div>
              {openId === embed.id ? (
                <iframe
                  title={title}
                  src={soundCloudWidgetSrc(embed.url)}
                  width="100%"
                  height={166}
                  style={{ border: 0, display: 'block' }}
                  allow="autoplay; encrypted-media"
                  loading="lazy"
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
