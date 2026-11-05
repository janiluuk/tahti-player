import { useEffect, useRef } from 'react';

import type { PublicChannel } from '../api/types';
import {
  hasLocalChannelPageLayout,
  loadChannelPageLayout,
  parseChannelPageLayout,
  saveChannelPageLayout,
  type ChannelPageItem,
} from '../lib/channelPageLayout';
import { persistChannelPageLayout } from '../lib/persistChannelPageLayout';

/** Keeps the channel page on the layout saved on the channel
 * (`pageLayoutJson`), and uploads an owner's browser-only layout once. */
export function useServerChannelLayout({
  slug,
  channel,
  isOwner,
  editing,
  layoutDirty,
  setLayout,
}: {
  slug: string;
  channel: PublicChannel | null;
  isOwner: boolean;
  editing: boolean;
  layoutDirty: boolean;
  setLayout: (items: ChannelPageItem[]) => void;
}) {
  const serverLayoutJson = channel?.pageLayoutJson ?? null;
  const pausedRef = useRef(editing || layoutDirty);
  pausedRef.current = editing || layoutDirty;
  const setLayoutRef = useRef(setLayout);
  setLayoutRef.current = setLayout;

  // Only a new server copy replaces the layout, and never mid-edit.
  useEffect(() => {
    if (pausedRef.current) {
      return;
    }
    const serverLayout = parseChannelPageLayout(serverLayoutJson);
    if (serverLayout) {
      setLayoutRef.current(serverLayout);
      saveChannelPageLayout(slug, serverLayout);
    }
  }, [serverLayoutJson, slug]);

  // Layouts saved before the server kept them lived only in the owner's
  // browser: upload one once so visitors see it too.
  const migratedRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      !isOwner ||
      !channel ||
      channel.pageLayoutJson ||
      migratedRef.current === slug ||
      !hasLocalChannelPageLayout(slug)
    ) {
      return;
    }
    migratedRef.current = slug;
    void persistChannelPageLayout(slug, loadChannelPageLayout(slug));
  }, [isOwner, channel, slug]);
}
