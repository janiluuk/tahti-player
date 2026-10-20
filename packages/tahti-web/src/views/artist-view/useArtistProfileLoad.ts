import { useEffect, useState } from 'react';

import {
  fetchMyPressKitImages,
  fetchPublicPressKitImages,
  type PublicPressKitImage,
} from '../../api/artist-settings';
import { fetchProfile } from '../../api/client';
import { fetchPublicMentions, type PublicMention } from '../../api/mentions';
import type { PublicProfile } from '../../api/types';
import { syncDocumentMetadata } from '../../lib/seo';

export function useArtistProfileLoad(username: string, isOwner: boolean) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [galleryImages, setGalleryImages] = useState<PublicPressKitImage[]>([]);
  const [galleryLoaded, setGalleryLoaded] = useState(false);
  const [taggedIn, setTaggedIn] = useState<PublicMention[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void fetchProfile(username)
      .then((res) => {
        if (cancelled) {
          return;
        }
        setProfile(res.data);
        if (res.data) {
          const { displayName, bio, avatarUrl } = res.data.artist;
          syncDocumentMetadata(window.location.pathname, {
            title: `${displayName} on Tahti`,
            description:
              bio ??
              `Explore ${displayName}'s music, releases, collections, and live channel on Tahti.`,
            image: avatarUrl ?? undefined,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setProfile(null);
          setLoadError(
            err instanceof Error ? err.message : 'Could not load this artist.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    void fetchPublicMentions(username)
      .then((mentions) => !cancelled && setTaggedIn(mentions.data))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [username, attempt]);

  useEffect(() => {
    let cancelled = false;
    setGalleryLoaded(false);
    const load = isOwner
      ? fetchMyPressKitImages().then((res) =>
          res.data.map(({ id, imageUrl, title }) => ({ id, imageUrl, title })),
        )
      : fetchPublicPressKitImages(username).then((res) => res.data);
    void load
      .then((images) => {
        if (!cancelled) {
          setGalleryImages(images);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setGalleryLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [username, isOwner]);

  return {
    profile,
    setProfile,
    loading,
    loadError,
    retry: () => setAttempt((n) => n + 1),
    galleryImages,
    setGalleryImages,
    galleryLoaded,
    taggedIn,
  };
}
