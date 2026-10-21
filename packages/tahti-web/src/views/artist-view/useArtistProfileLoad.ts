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
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [taggedIn, setTaggedIn] = useState<PublicMention[]>([]);
  const [mentionsError, setMentionsError] = useState<string | null>(null);

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
    setMentionsError(null);
    void fetchPublicMentions(username)
      .then((mentions) => {
        if (!cancelled) {
          setTaggedIn(mentions.data);
          setMentionsError(
            mentions.meta.source === 'api'
              ? (mentions.meta.reason ?? null)
              : null,
          );
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setMentionsError(err instanceof Error ? err.message : 'Failed');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [username, attempt]);

  useEffect(() => {
    let cancelled = false;
    setGalleryLoaded(false);
    setGalleryError(null);
    const load = isOwner
      ? fetchMyPressKitImages().then((res) => ({
          images: res.data.map(({ id, imageUrl, title }) => ({
            id,
            imageUrl,
            title,
          })),
          meta: res.meta,
        }))
      : fetchPublicPressKitImages(username).then((res) => ({
          images: res.data,
          meta: res.meta,
        }));
    void load
      .then(({ images, meta }) => {
        if (!cancelled) {
          setGalleryImages(images);
          setGalleryError(meta.source === 'api' ? (meta.reason ?? null) : null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setGalleryError(err instanceof Error ? err.message : 'Failed');
        }
      })
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
    galleryError,
    taggedIn,
    mentionsError,
  };
}
