import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  cancelShowBooking,
  createEpisode,
  createShowBooking,
  fetchEpisodesForShow,
  fetchShowBookings,
  fetchShowSeriesById,
  patchShowSeries,
  type StudioEpisode,
  type StudioShowBooking,
  type StudioShowSeries,
} from '../../../api/shows';
import { uploadSoundFile } from '../../../api/studio';
import { uploadUserMediaFile } from '../../../api/user-media';

/** Loading, editing, booking and episode creation for one show series. */
export function useShowDetail(id: string) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as {
    tab?: 'overview' | 'episodes' | 'recordings';
  };
  const showTab = search.tab ?? 'overview';
  const setShowTab = (tab: 'overview' | 'episodes' | 'recordings') => {
    void navigate({
      to: '/studio/shows/$id',
      params: { id },
      search: tab === 'overview' ? {} : { tab },
    });
  };
  const [show, setShow] = useState<StudioShowSeries | null>(null);
  const [episodes, setEpisodes] = useState<StudioEpisode[]>([]);
  const [bookings, setBookings] = useState<StudioShowBooking[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [source, setSource] = useState<'upload' | 'broadcast'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [backdropFile, setBackdropFile] = useState<File | null>(null);
  const [autoPublish, setAutoPublish] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const recordingCount = episodes.filter(
    (episode) => episode.source === 'broadcast',
  ).length;

  const reload = () => {
    fetchShowSeriesById(id)
      .then((r) => {
        setShow(r.data);
        if (r.data) {
          setTitle(r.data.title);
          setDescription(r.data.description);
          setThumbnailUrl(r.data.coverUrl ?? '');
          setBackdropUrl(r.data.backdropUrl ?? '');
          setAutoPublish(r.data.autoPublish ?? true);
        }
      })
      .catch(() => toast.error('Could not load the show.'))
      .finally(() => setLoaded(true));
    fetchEpisodesForShow(id)
      .then((r) => setEpisodes(r.data))
      .catch(() => toast.error('Could not load the episodes.'));
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 14 * 24 * 3600_000).toISOString();
    fetchShowBookings(from, to)
      .then((r) => setBookings(r.data.filter((b) => b.isMine)))
      .catch(() => undefined);
  };

  useEffect(() => {
    reload();
  }, [id]);

  const nextEpisodeNumber = show?.nextEpisodeNumber ?? 1;
  const defaultEpisodeTitle = useMemo(() => {
    if (!show) {
      return '';
    }
    return `${show.title} — Episode ${nextEpisodeNumber}`;
  }, [show, nextEpisodeNumber]);

  const nextSlotHint = useMemo(() => {
    const upcoming = bookings
      .filter((b) => new Date(b.startAt).getTime() > Date.now())
      .sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      )[0];
    if (!upcoming) {
      return null;
    }
    return upcoming;
  }, [bookings]);

  /** Uploads a picked image and returns its stored URL. A picked file is only
   * a local blob: preview until this runs, so it must never be saved as the
   * show's URL directly. */
  const uploadPicked = async (file: File | null, current: string) => {
    if (!file) {
      return current;
    }
    const result = await uploadUserMediaFile(file);
    if (!result.ok) {
      throw new Error(result.error);
    }
    return result.data.url;
  };

  const saveMeta = async () => {
    if (!show) {
      return;
    }
    setSavingMeta(true);
    try {
      const [coverUrl, backdrop] = await Promise.all([
        uploadPicked(thumbnailFile, thumbnailUrl.trim()),
        uploadPicked(backdropFile, backdropUrl.trim()),
      ]);
      const r = await patchShowSeries(show.id, {
        title: title.trim() || show.title,
        description: description.trim(),
        coverUrl: coverUrl || null,
        backdropUrl: backdrop || null,
        autoPublish,
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setShow(r.data);
      setThumbnailUrl(r.data.coverUrl ?? '');
      setBackdropUrl(r.data.backdropUrl ?? '');
      setThumbnailFile(null);
      setBackdropFile(null);
      toast.success('Show details saved — new episodes will inherit these.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save the show.',
      );
    } finally {
      setSavingMeta(false);
    }
  };

  const bookNextInterval = async () => {
    if (!show) {
      return;
    }
    setBusy(true);
    setMsg(null);
    const start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 24);
    const end = new Date(start);
    end.setHours(end.getHours() + show.intervalHours);
    const r = await createShowBooking({
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      note: show.title,
      showType: show.showType,
    });
    setBusy(false);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    const episode = await createEpisode({
      showId: show.id,
      source: 'broadcast',
      slotStartAt: r.data.startAt,
      slotEndAt: r.data.endAt,
      bookingId: r.data.id,
    });
    if (!episode.ok) {
      const cancel = await cancelShowBooking(r.data.id);
      setMsg(
        cancel.ok
          ? `Episode setup failed, so the slot was released: ${episode.error}`
          : `Episode setup failed: ${episode.error} The slot is booked but has no episode yet — try creating it again.`,
      );
      reload();
      return;
    }
    void navigate({
      to: '/studio/shows/episodes/$episodeId',
      params: { episodeId: episode.data.id },
    });
  };

  const createNewEpisode = async () => {
    if (!show) {
      return;
    }
    if (source === 'upload' && !file) {
      toast.error('Choose an audio file to upload.');
      return;
    }
    setBusy(true);
    setMsg(null);
    let soundId: string | null = null;
    try {
      if (source === 'upload' && file) {
        const up = await uploadSoundFile({ file, title: defaultEpisodeTitle });
        if (!up.ok) {
          toast.error(up.error);
          return;
        }
        soundId = up.itemId;
      }

      // Only a recorded episode takes the upcoming booking; an uploaded one
      // is not tied to a broadcast slot.
      const slot = source === 'broadcast' ? nextSlotHint : null;
      const ep = await createEpisode({
        showId: show.id,
        source,
        soundId,
        slotStartAt: slot?.startAt ?? null,
        slotEndAt: slot?.endAt ?? null,
        bookingId: slot?.id ?? null,
      });
      if (!ep.ok) {
        toast.error(
          soundId
            ? `${ep.error} The audio was uploaded to your library; add it to an episode later.`
            : ep.error,
        );
        return;
      }
      setCreateOpen(false);
      setFile(null);
      void navigate({
        to: '/studio/shows/episodes/$episodeId',
        params: { episodeId: ep.data.id },
      });
    } catch {
      toast.error('Could not create the episode.');
    } finally {
      setBusy(false);
    }
  };

  return {
    show,
    episodes,
    setEpisodes,
    bookings,
    msg,
    createOpen,
    setCreateOpen,
    source,
    setSource,
    file,
    setFile,
    busy,
    title,
    setTitle,
    description,
    setDescription,
    thumbnailUrl,
    setThumbnailUrl,
    backdropUrl,
    setBackdropUrl,
    thumbnailFile,
    setThumbnailFile,
    backdropFile,
    setBackdropFile,
    autoPublish,
    setAutoPublish,
    savingMeta,
    loaded,
    showTab,
    setShowTab,
    recordingCount,
    reload,
    nextEpisodeNumber,
    nextSlotHint,
    defaultEpisodeTitle,
    saveMeta,
    bookNextInterval,
    createNewEpisode,
  };
}

export type ShowDetailState = ReturnType<typeof useShowDetail>;
