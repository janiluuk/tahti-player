import { UsersIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { MediaArtwork } from '@tahti-player/ui';

import type { ChannelMember } from '../../api/artist-settings/moderation';
import { fetchPublicChannelMembers } from '../../api/channel-members';
import { placeholderArtworkUrl } from '../../lib/placeholderArt';
import { Eyebrow } from '../tahti/Eyebrow';

export function ArtistCredits({ channelSlug }: { channelSlug: string }) {
  const [members, setMembers] = useState<ChannelMember[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicChannelMembers(channelSlug).then((rows) => {
      if (!cancelled) {
        setMembers(rows);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [channelSlug]);

  if (members.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Credits">
      <Eyebrow>
        <span className="inline-flex items-center gap-1.5">
          <UsersIcon size={13} aria-hidden />
          Credits
        </span>
      </Eyebrow>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-3">
        {members.map((member) => (
          <li key={member.id} className="flex items-center gap-3 text-sm">
            <MediaArtwork
              size="sm"
              className="rounded-full"
              src={member.pictureUrl ?? placeholderArtworkUrl(member.id)}
              alt=""
            />
            <div className="min-w-0">
              <span className="block truncate font-medium">{member.name}</span>
              <span className="text-foreground-secondary block truncate text-xs">
                {member.role}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
