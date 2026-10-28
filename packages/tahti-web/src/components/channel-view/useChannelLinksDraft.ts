import { useEffect, useRef, useState } from 'react';

import type { ChannelLink } from '../../api/channel-design';
import type { PublicChannel } from '../../api/types';

/** The Links editor's draft. Seeded once per channel visit (not on every
 * refetch) so typing is never clobbered by a look/layout save elsewhere on
 * the page; empty channels are pre-filled from the artist's social links
 * unless the user has already typed. */
export function useChannelLinksDraft(
  channel: PublicChannel | null,
  artistSocialLinks: Record<string, string>,
) {
  const [links, setLinks] = useState<ChannelLink[]>([]);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const baseline = useRef<ChannelLink[]>([]);
  dirtyRef.current = dirty;

  useEffect(() => {
    if (!channel) {
      return;
    }
    baseline.current = channel.channelLinks ?? [];
    setLinks(baseline.current);
    setDirty(false);
  }, [channel?.slug]);

  useEffect(() => {
    if (!channel || (channel.channelLinks?.length ?? 0) > 0) {
      return;
    }
    const entries = Object.entries(artistSocialLinks).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === 'string' &&
        Boolean(entry[1]) &&
        entry[0] !== 'genres' &&
        entry[0] !== 'showConnections',
    );
    if (entries.length === 0) {
      return;
    }
    setLinks((current) =>
      dirtyRef.current || current.length > 0
        ? current
        : entries.map(([label, url]) => ({
            label: label.charAt(0).toUpperCase() + label.slice(1),
            url,
          })),
    );
  }, [channel?.slug, artistSocialLinks]);

  return {
    links,
    dirty,
    edit: (next: ChannelLink[]) => {
      if (!dirty) {
        baseline.current = links;
      }
      setLinks(next);
      setDirty(true);
    },
    markSaved: () => {
      baseline.current = links;
      setDirty(false);
    },
    revert: () => {
      setLinks(baseline.current);
      setDirty(false);
    },
  };
}
