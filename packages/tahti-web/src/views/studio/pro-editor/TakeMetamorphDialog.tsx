import { PauseIcon, PlayIcon, PlusIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { encodeWav } from '@tahti-player/audio-editor';
import { renderTakeMorph, type MorphCurve } from '@tahti-player/audio-rack';
import {
  Button,
  Dialog,
  EmptyState,
  Select,
  Slider,
  Toggle,
} from '@tahti-player/ui';

import {
  fetchSoundVersions,
  fetchVersionDownloadUrl,
  type SoundVersion,
} from '../../../api/sound-versions';
import {
  defaultMorphPair,
  metamorphClipName,
  MORPH_CURVE_LABELS,
  morphableVersions,
} from '../../../lib/takeMetamorph';

export type TakeLoader = (
  soundId: string,
  versionId: string,
  ctx: BaseAudioContext,
) => Promise<AudioBuffer>;

const loadTakeFromApi: TakeLoader = async (soundId, versionId, ctx) => {
  const link = await fetchVersionDownloadUrl(soundId, versionId);
  if (!link.ok) {
    throw new Error(link.error);
  }
  const res = await fetch(link.url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Could not download the version (${res.status})`);
  }
  return ctx.decodeAudioData(await res.arrayBuffer());
};

const CURVE_OPTIONS = (Object.keys(MORPH_CURVE_LABELS) as MorphCurve[]).map(
  (id) => ({ id, label: MORPH_CURVE_LABELS[id] }),
);

type Rendered = { key: string; buffer: AudioBuffer };

/**
 * Pick two versions of a sound, morph the second one's grains into the first
 * one's timeline, preview the result and drop it onto a new Multitrack lane.
 */
export function TakeMetamorphDialog({
  isOpen,
  onClose,
  soundId,
  onAddClip,
  loadTake = loadTakeFromApi,
}: {
  isOpen: boolean;
  onClose: () => void;
  soundId: string;
  onAddClip: (blob: Blob, name: string) => void | Promise<void>;
  loadTake?: TakeLoader;
}) {
  const [versions, setVersions] = useState<SoundVersion[] | null>(null);
  const [hostId, setHostId] = useState('');
  const [donorId, setDonorId] = useState('');
  const [amountPct, setAmountPct] = useState(50);
  const [curve, setCurve] = useState<MorphCurve>('equal-power');
  const [rising, setRising] = useState(false);
  const [busy, setBusy] = useState<'render' | 'add' | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const takesRef = useRef(new Map<string, Promise<AudioBuffer>>());
  const renderedRef = useRef<Rendered | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let cancelled = false;
    setVersions(null);
    fetchSoundVersions(soundId)
      .then((r) => {
        if (cancelled) {
          return;
        }
        const ready = morphableVersions(r.data);
        setVersions(ready);
        const pair = defaultMorphPair(ready);
        setHostId(pair?.hostId ?? '');
        setDonorId(pair?.donorId ?? '');
      })
      .catch(() => {
        if (!cancelled) {
          setVersions([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, soundId]);

  const stopPreview = () => {
    sourceRef.current?.stop();
    sourceRef.current = null;
    setPreviewing(false);
  };

  useEffect(() => {
    const takes = takesRef.current;
    return () => {
      sourceRef.current?.stop();
      void ctxRef.current?.close();
      ctxRef.current = null;
      takes.clear();
    };
  }, []);

  const host = versions?.find((v) => v.id === hostId) ?? null;
  const donor = versions?.find((v) => v.id === donorId) ?? null;
  const settings = useMemo(
    () => ({
      amount: amountPct / 100,
      curve,
      sweep: rising ? ('rise' as const) : ('hold' as const),
    }),
    [amountPct, curve, rising],
  );
  const settingsKey = `${hostId}|${donorId}|${amountPct}|${curve}|${rising}`;
  const samePick = Boolean(hostId) && hostId === donorId;
  const canRender = Boolean(host && donor) && !samePick && busy === null;

  const audioCtx = () => {
    ctxRef.current ??= new AudioContext();
    return ctxRef.current;
  };

  const take = (versionId: string) => {
    let pending = takesRef.current.get(versionId);
    if (!pending) {
      pending = loadTake(soundId, versionId, audioCtx());
      pending.catch(() => takesRef.current.delete(versionId));
      takesRef.current.set(versionId, pending);
    }
    return pending;
  };

  const render = async (): Promise<AudioBuffer> => {
    if (renderedRef.current?.key === settingsKey) {
      return renderedRef.current.buffer;
    }
    const [hostBuf, donorBuf] = await Promise.all([
      take(hostId),
      take(donorId),
    ]);
    const buffer = await renderTakeMorph(hostBuf, donorBuf, settings);
    renderedRef.current = { key: settingsKey, buffer };
    return buffer;
  };

  const run = async (kind: 'render' | 'add', job: () => Promise<void>) => {
    setBusy(kind);
    setError(null);
    try {
      await job();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The morph failed.');
    } finally {
      setBusy(null);
    }
  };

  const preview = () =>
    run('render', async () => {
      stopPreview();
      const buffer = await render();
      const ctx = audioCtx();
      await ctx.resume();
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      src.onended = () => {
        if (sourceRef.current === src) {
          sourceRef.current = null;
          setPreviewing(false);
        }
      };
      src.start();
      sourceRef.current = src;
      setPreviewing(true);
    });

  const addToMultitrack = () =>
    run('add', async () => {
      if (!host || !donor) {
        return;
      }
      stopPreview();
      const buffer = await render();
      const name = metamorphClipName(host, donor, settings);
      await onAddClip(encodeWav(buffer), name);
      toast.success(`Added “${name}” to Multitrack.`);
      onClose();
    });

  const versionOptions = (versions ?? []).map((v) => ({
    id: v.id,
    label: `v${v.versionNumber}${v.versionLabel ? ` · ${v.versionLabel}` : ''}${v.isActive ? ' (live)' : ''}`,
  }));

  const close = () => {
    stopPreview();
    onClose();
  };

  return (
    <Dialog.Root isOpen={isOpen} onClose={close} className="max-w-xl">
      <Dialog.Title>Metamorph between takes</Dialog.Title>
      <Dialog.Description>
        Keep one version&apos;s timing and dynamics and bleed in the sound of
        another. The result lands on a new Multitrack lane, ready to bounce as a
        revision.
      </Dialog.Description>
      <div className="mt-4 flex min-w-0 flex-col gap-4">
        {versions === null ? (
          <p className="text-foreground-secondary text-sm" role="status">
            Loading versions…
          </p>
        ) : versions.length < 2 ? (
          <EmptyState
            size="sm"
            title="Two versions needed"
            description="Upload or render another revision of this sound first, then morph between them."
          />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Keep the shape of"
                options={versionOptions}
                value={hostId}
                onValueChange={(id) => {
                  stopPreview();
                  setHostId(id);
                }}
              />
              <Select
                label="Bleed in the sound of"
                options={versionOptions}
                value={donorId}
                error={samePick ? 'Pick two different versions.' : undefined}
                onValueChange={(id) => {
                  stopPreview();
                  setDonorId(id);
                }}
              />
            </div>
            <Slider
              label="Morph amount"
              min={0}
              max={100}
              step={1}
              unit="%"
              value={amountPct}
              onValueChange={setAmountPct}
              showValue
              startLabel="First take"
              endLabel="Second take"
            />
            <div className="grid items-end gap-3 sm:grid-cols-2">
              <Select
                label="Crossfade curve"
                options={CURVE_OPTIONS}
                value={curve}
                onValueChange={(id) => setCurve(id as MorphCurve)}
              />
              <div className="flex items-center gap-3 pb-2">
                <Toggle
                  checked={rising}
                  onChange={setRising}
                  label="Rise across the track"
                />
                <span className="text-sm">
                  Rise across the track
                  <span className="text-foreground-secondary block text-xs">
                    Start as the first take, end at the amount above.
                  </span>
                </span>
              </div>
            </div>
            {error ? (
              <p className="text-accent-red text-sm" role="alert">
                {error}
              </p>
            ) : busy === 'render' ? (
              <p className="text-foreground-secondary text-sm" role="status">
                Rendering the morph in your browser…
              </p>
            ) : null}
          </>
        )}
      </div>
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        {previewing ? (
          <Button variant="secondary" onClick={stopPreview}>
            <PauseIcon size={16} aria-hidden />
            Stop preview
          </Button>
        ) : (
          <Button
            variant="secondary"
            disabled={!canRender}
            onClick={() => void preview()}
          >
            <PlayIcon size={16} aria-hidden />
            Preview
          </Button>
        )}
        <Button disabled={!canRender} onClick={() => void addToMultitrack()}>
          <PlusIcon size={16} aria-hidden />
          {busy === 'add' ? 'Adding…' : 'Add to Multitrack'}
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
