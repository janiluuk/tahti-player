import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { parseCredits } from '../../api/distribution';
import { setSoundPurchaseAccess } from '../../api/purchase-tiers';
import { fetchHearthisTrackById } from '../../api/sources';
import {
  fetchEditorDraft,
  fetchEditorSource,
  fetchMyRadioSubmissions,
  fetchStudioSound,
  patchStudioSound,
  renderEditorDraft,
  submitTrackToRadioRotation,
  type RadioSubmission,
} from '../../api/studio';
import type {
  EditList,
  StudioSound,
  StudioSoundPatch,
} from '../../api/studio-types';
import { createDefaultEditList } from '../../api/studio-types';
import { autoTrimCuts } from '../../lib/autoTrimCuts';
import { playableFromStudioHearthis } from '../../lib/embedPlayback';
import { capitalizeGenre } from '../../lib/genres';
import { useMasteringFeatureStore } from '../../plugins/mastering/store';
import { useAuthStore } from '../../stores/authStore';
import { usePlayerStore } from '../../stores/playerStore';

export type Tab =
  'basics' | 'tracklist' | 'audio' | 'sharing' | 'export' | 'advanced';

export const TAB_ORDER: Tab[] = [
  'basics',
  'tracklist',
  'audio',
  'sharing',
  'export',
  'advanced',
];

/** Loading, editing, playback and quick-render state for the track edit
 * dialog, shared across its per-tab components. */
export function useTrackEditDialog(
  soundId: string | null,
  onSaved?: (item: StudioSound) => void,
) {
  const masteringEnabled = useMasteringFeatureStore((state) => state.enabled);
  const user = useAuthStore((state) => state.user);
  const play = usePlayerStore((state) => state.play);
  const setPlayerStatus = usePlayerStore((state) => state.setStatus);
  const seekTo = usePlayerStore((state) => state.seekTo);
  const currentId = usePlayerStore((state) => state.currentId);
  const playerStatus = usePlayerStore((state) => state.status);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const playerDuration = usePlayerStore((state) => state.duration);
  const isOpen = Boolean(soundId);
  const [tab, setTab] = useState<Tab>('basics');
  const [item, setItem] = useState<StudioSound | null>(null);
  const [form, setForm] = useState<StudioSoundPatch>({});
  const [purchaseTierId, setPurchaseTierId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  // Only the initial load failure stays inline — it can leave the dialog
  // with nothing else to show. Save/upload/submit results go to a toast
  // instead of a message left sitting in the form (see save() and the
  // radio-submission handler below).
  const [loadError, setLoadError] = useState<string | null>(null);
  const [radioSubmission, setRadioSubmission] =
    useState<RadioSubmission | null>(null);
  const [submittingToRadio, setSubmittingToRadio] = useState(false);
  const [downloadingEmbed, setDownloadingEmbed] = useState(false);
  const [editList, setEditList] = useState<EditList | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [quickBusy, setQuickBusy] = useState<'normalize' | 'trim' | null>(null);
  const [revisionTick, setRevisionTick] = useState(0);
  const [playBusy, setPlayBusy] = useState(false);
  const isDjMix = form.contentType === 'DJ_SET';
  const isAudioClip = form.contentType === 'CLIP';
  const visibleTabOrder = isDjMix
    ? TAB_ORDER
    : TAB_ORDER.filter((tabId) => tabId !== 'tracklist');

  useEffect(() => {
    if (!soundId) {
      setRadioSubmission(null);
      return;
    }
    void fetchMyRadioSubmissions().then(({ data }) => {
      const latest = data.find((s) => s.sound.id === soundId);
      setRadioSubmission(latest ?? null);
    });
  }, [soundId]);

  useEffect(() => {
    if (!isDjMix && tab === 'tracklist') {
      setTab('basics');
    }
  }, [isDjMix, tab]);

  useEffect(() => {
    if (!soundId) {
      setItem(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setTab('basics');
    void fetchStudioSound(soundId)
      .then((res) => {
        if (cancelled) {
          return;
        }
        setItem(res.data);
        setForm({
          title: res.data.title,
          description: res.data.description ?? '',
          artistName: res.data.artistName ?? '',
          genre: res.data.genre ? capitalizeGenre(res.data.genre) : '',
          subGenres: res.data.subGenres ?? [],
          credits: parseCredits(res.data.credits ?? []),
          contentType: res.data.contentType ?? 'TRACK',
          license: res.data.license ?? '',
          isPublic: res.data.isPublic ?? true,
          visibility:
            res.data.visibility ??
            (res.data.isPublic === false ? 'PRIVATE' : 'PUBLIC'),
          releaseDate: res.data.releaseDate ?? '',
          downloadsEnabled: res.data.downloadsEnabled ?? false,
          isFallback: res.data.isFallback ?? false,
          commentsEnabled: res.data.commentsEnabled ?? true,
          selectsOptIn: res.data.selectsOptIn ?? false,
          topListsEligible: res.data.topListsEligible ?? true,
          bannerUrl: res.data.bannerUrl ?? '',
          backgroundUrl: res.data.backgroundUrl ?? '',
          tracklist: res.data.tracklist ?? [],
          fanTierIds: res.data.fanTierIds ?? [],
          tracklistOverlay: res.data.tracklistOverlay ?? {
            enabled: false,
            preset: 'cards',
          },
        });
        setPurchaseTierId(res.data.purchaseTierId ?? null);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : 'Track load failed',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [soundId]);

  useEffect(() => {
    if (!soundId) {
      setEditList(null);
      setPeaks([]);
      return;
    }
    let cancelled = false;
    void fetchEditorDraft(soundId).then((res) => {
      if (cancelled) {
        return;
      }
      setEditList(res.data.editList);
      const level = res.data.editorPeaks?.levels?.[0];
      setPeaks(level && level.length > 0 ? level : []);
    });
    return () => {
      cancelled = true;
    };
  }, [soundId]);

  const updateArtwork = (url: string) => {
    setForm((current) => ({ ...current, bannerUrl: url }));
    setItem((current) => (current ? { ...current, bannerUrl: url } : current));
    if (item) {
      onSaved?.({ ...item, bannerUrl: url });
    }
  };

  const downloadHearthisEmbed = async () => {
    if (
      !item ||
      item.embedProvider !== 'HEARTHIS' ||
      !item.embedUri ||
      !form.downloadsEnabled
    ) {
      return;
    }
    setDownloadingEmbed(true);
    const track = await fetchHearthisTrackById(item.embedUri);
    setDownloadingEmbed(false);
    if (!track?.streamUrl) {
      toast.error('This HearThis track is not available for download.');
      return;
    }
    const link = document.createElement('a');
    link.href = track.streamUrl;
    link.download = `${item.title || 'hearthis-track'}.audio`;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const isCurrentPlayable = currentId === `sound:${soundId}`;
  const isPlaying =
    isCurrentPlayable &&
    (playerStatus === 'playing' || playerStatus === 'loading');

  const startPlayback = async (startAt?: number) => {
    if (!item || !soundId) {
      return;
    }
    const playableId = `sound:${soundId}`;
    if (currentId === playableId) {
      if (startAt !== undefined) {
        seekTo(startAt);
      }
      setPlayerStatus('playing');
      return;
    }
    const hearthis = playableFromStudioHearthis(item);
    if (hearthis) {
      play(hearthis);
      if (startAt !== undefined) {
        seekTo(startAt);
      }
      return;
    }
    setPlayBusy(true);
    const { data } = await fetchEditorSource(soundId);
    setPlayBusy(false);
    play({
      id: playableId,
      kind: 'sound',
      title: item.title,
      artist: item.artistName || '',
      coverUrl: item.bannerUrl ?? undefined,
      streamUrl: data.url,
      protocol: data.url.includes('.m3u8') ? 'hls' : 'https',
    });
    if (startAt !== undefined) {
      seekTo(startAt);
    }
  };

  const runQuickEdit = async (
    kind: 'normalize' | 'trim',
    next: EditList,
    label: string,
  ) => {
    if (!soundId) {
      return;
    }
    setQuickBusy(kind);
    const result = await renderEditorDraft(soundId, next, label);
    setQuickBusy(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setEditList(next);
    toast.success('Queued as a new version — activate it below when ready.');
    setRevisionTick((tick) => tick + 1);
  };

  const onNormalize = () => {
    const base = editList ?? createDefaultEditList(item?.durationSec ?? 180);
    void runQuickEdit(
      'normalize',
      { ...base, loudnorm: { ...base.loudnorm, enabled: true } },
      'Quick normalize',
    );
  };

  const onAutoTrim = () => {
    const base = editList ?? createDefaultEditList(item?.durationSec ?? 180);
    const cuts = autoTrimCuts(peaks, base.sourceDuration);
    if (cuts.length === 0) {
      toast.info('No leading/trailing silence detected.');
      return;
    }
    void runQuickEdit(
      'trim',
      { ...base, cuts: [...base.cuts, ...cuts] },
      'Quick auto-trim',
    );
  };

  const submitToRadioRotation = () => {
    if (!soundId) {
      return;
    }
    setSubmittingToRadio(true);
    void submitTrackToRadioRotation(soundId)
      .then((result) => {
        if (result.ok) {
          toast.success('Submitted to Tahti Radio for review.');
          setRadioSubmission({
            id: 'pending-local',
            status: 'PENDING',
            rejectionNote: null,
            createdAt: new Date().toISOString(),
            sound: { id: soundId, title: form.title ?? '' },
          });
        } else {
          toast.error(result.error);
        }
      })
      .finally(() => setSubmittingToRadio(false));
  };

  const save = async () => {
    if (!soundId || !item || !form.title?.trim()) {
      return;
    }
    setSaving(true);
    const { license, ...metadata } = form;
    const trimmedCredits = (form.credits ?? [])
      .map((credit) => {
        const handle = credit.artistUsername
          ?.trim()
          .replace(/^@/, '')
          .toLowerCase();
        return {
          role: credit.role,
          name: credit.name.trim(),
          ...(handle && /^[a-z0-9_-]{2,32}$/.test(handle)
            ? { artistUsername: handle }
            : {}),
        };
      })
      .filter((credit) => credit.name.length > 0);
    const result = await patchStudioSound(soundId, {
      ...metadata,
      ...(license ? { license } : {}),
      title: form.title.trim(),
      artistName: form.artistName?.trim() || null,
      credits: trimmedCredits,
      genre: form.genre?.trim() || null,
      isPublic: form.visibility === 'PUBLIC',
      releaseDate: form.releaseDate || null,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if (purchaseTierId !== (item.purchaseTierId ?? null)) {
      const accessResult = await setSoundPurchaseAccess(
        soundId,
        purchaseTierId,
      );
      if (!accessResult.ok) {
        toast.error(accessResult.error);
      } else {
        result.data.purchaseTierId = purchaseTierId;
        result.data.accessMode = purchaseTierId ? 'PURCHASE' : 'FREE';
      }
    }
    setItem(result.data);
    setForm((current) => ({
      ...current,
      title: result.data.title,
      description: result.data.description ?? '',
      artistName: result.data.artistName ?? '',
      genre: result.data.genre ?? '',
      subGenres: result.data.subGenres ?? [],
      credits: parseCredits(result.data.credits ?? []),
      contentType: result.data.contentType ?? current.contentType,
      license: result.data.license ?? '',
      isPublic: result.data.isPublic ?? true,
      visibility:
        result.data.visibility ??
        (result.data.isPublic === false ? 'PRIVATE' : 'PUBLIC'),
      releaseDate: result.data.releaseDate ?? '',
      downloadsEnabled: result.data.downloadsEnabled ?? false,
      isFallback: result.data.isFallback ?? false,
      commentsEnabled: result.data.commentsEnabled ?? true,
      bannerUrl: result.data.bannerUrl ?? '',
      backgroundUrl: result.data.backgroundUrl ?? '',
      tracklist: result.data.tracklist ?? [],
      fanTierIds: result.data.fanTierIds ?? current.fanTierIds ?? [],
      tracklistOverlay: result.data.tracklistOverlay ?? {
        enabled: false,
        preset: 'cards',
      },
    }));
    toast.success('Track details saved.');
    onSaved?.(result.data);
  };

  return {
    masteringEnabled,
    user,
    isOpen,
    tab,
    setTab,
    item,
    form,
    setForm,
    purchaseTierId,
    setPurchaseTierId,
    loading,
    saving,
    playlistOpen,
    setPlaylistOpen,
    loadError,
    radioSubmission,
    submittingToRadio,
    downloadingEmbed,
    editList,
    peaks,
    quickBusy,
    revisionTick,
    playBusy,
    isDjMix,
    isAudioClip,
    visibleTabOrder,
    updateArtwork,
    downloadHearthisEmbed,
    isCurrentPlayable,
    isPlaying,
    currentTime,
    playerDuration,
    startPlayback,
    setPlayerStatus,
    onNormalize,
    onAutoTrim,
    submitToRadioRotation,
    save,
  };
}

export type TrackEditDialogState = ReturnType<typeof useTrackEditDialog>;
