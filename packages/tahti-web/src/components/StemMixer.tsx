import {
  DownloadIcon,
  HeadphonesIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  Volume2Icon,
  VolumeXIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button, ExternalLink, Slider } from '@tahti-player/ui';

import { cn } from '../lib/cn';
import {
  channelFor,
  effectiveStemGains,
  setStemLevel,
  toggleStemMute,
  toggleStemSolo,
  type StemMix,
} from '../lib/stemMix';

type StemFile = { label: string; url: string };

/**
 * Compact live mixer for a set of stems split from the same track: one
 * transport plays every stem in sync, and each stem gets mute, solo and a
 * level fader that apply while it plays.
 *
 * Muted or un-soloed stems keep playing at zero volume rather than pausing,
 * so bringing one back doesn't drift it out of sync. Plain `<audio>`
 * elements aren't sample-accurate, so the first stem's `timeupdate` nudges
 * any stem that has drifted more than 150ms back into line.
 */
export function StemMixer({
  files,
  defaultMix = {},
}: {
  files: StemFile[];
  defaultMix?: StemMix;
}) {
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const [playing, setPlaying] = useState(false);
  const [mix, setMix] = useState<StemMix>(defaultMix);

  const labels = useMemo(() => files.map((f) => f.label), [files]);
  const gains = useMemo(() => effectiveStemGains(labels, mix), [labels, mix]);
  const masterLabel = labels[0];
  const anySolo = labels.some((label) => channelFor(mix, label).solo);
  const touched = labels.some((label) => {
    const channel = channelFor(mix, label);
    return channel.muted || channel.solo || channel.level !== 1;
  });

  useEffect(() => {
    setPlaying(false);
  }, [files]);

  useEffect(() => {
    for (const label of labels) {
      const el = audioRefs.current[label];
      if (el) {
        const gain = gains[label] ?? 1;
        el.volume = gain;
        // iOS Safari ignores `volume`, so silence also goes through `muted`.
        el.muted = gain === 0;
      }
    }
  }, [labels, gains]);

  useEffect(() => {
    if (!masterLabel) {
      return;
    }
    const master = audioRefs.current[masterLabel];
    if (!master) {
      return;
    }
    const onTimeUpdate = () => {
      for (const label of labels) {
        if (label === masterLabel) {
          continue;
        }
        const el = audioRefs.current[label];
        if (el && Math.abs(el.currentTime - master.currentTime) > 0.15) {
          el.currentTime = master.currentTime;
        }
      }
    };
    const onEnded = () => setPlaying(false);
    master.addEventListener('timeupdate', onTimeUpdate);
    master.addEventListener('ended', onEnded);
    return () => {
      master.removeEventListener('timeupdate', onTimeUpdate);
      master.removeEventListener('ended', onEnded);
    };
  }, [labels, masterLabel]);

  if (files.length === 0) {
    return null;
  }

  const togglePlay = () => {
    const next = !playing;
    setPlaying(next);
    for (const label of labels) {
      const el = audioRefs.current[label];
      if (!el) {
        continue;
      }
      if (next) {
        void el.play().catch(() => undefined);
      } else {
        el.pause();
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          aria-label={playing ? 'Pause all stems' : 'Play all stems'}
          aria-pressed={playing}
          onClick={togglePlay}
        >
          {playing ? (
            <PauseIcon size={14} aria-hidden />
          ) : (
            <PlayIcon size={14} aria-hidden />
          )}
        </Button>
        <span className="text-foreground-secondary min-w-0 flex-1 text-xs">
          Mute, solo or turn down a stem while it plays. Shift-click solo to
          hear only that stem.
        </span>
        {touched ? (
          <Button
            size="xs"
            variant="text"
            aria-label="Reset stem mix"
            onClick={() => setMix({})}
          >
            <RotateCcwIcon size={14} aria-hidden className="mr-1" />
            Reset
          </Button>
        ) : null}
      </div>
      <ul className="divide-border divide-y" aria-label="Stem mix">
        {files.map((f) => {
          const channel = channelFor(mix, f.label);
          const silent = (gains[f.label] ?? 1) === 0;
          return (
            <li
              key={f.label}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 py-1.5 text-sm sm:grid-cols-[minmax(0,8rem)_minmax(0,1fr)_auto]"
            >
              <span
                className={cn(
                  'min-w-0 truncate',
                  silent && 'text-foreground-secondary',
                )}
              >
                {f.label}
                {anySolo && !channel.solo && !channel.muted ? (
                  <span className="sr-only"> (silenced by solo)</span>
                ) : null}
              </span>
              <div className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  value={Math.round(channel.level * 100)}
                  onValueChange={(value) =>
                    setMix((prev) => setStemLevel(prev, f.label, value / 100))
                  }
                >
                  <div className="sr-only">
                    <Slider.Header label={`${f.label} level`} />
                  </div>
                  <Slider.Surface>
                    <Slider.Track />
                    <Slider.RangeInput />
                  </Slider.Surface>
                </Slider>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="icon-sm"
                  variant={channel.muted ? 'tertiary' : 'text'}
                  aria-label={`Mute ${f.label}`}
                  aria-pressed={channel.muted}
                  onClick={() =>
                    setMix((prev) => toggleStemMute(prev, f.label))
                  }
                >
                  {channel.muted ? (
                    <VolumeXIcon size={14} aria-hidden />
                  ) : (
                    <Volume2Icon size={14} aria-hidden />
                  )}
                </Button>
                <Button
                  size="icon-sm"
                  variant={channel.solo ? 'tertiary' : 'text'}
                  aria-label={`Solo ${f.label}`}
                  aria-pressed={channel.solo}
                  onClick={(e) =>
                    setMix((prev) =>
                      toggleStemSolo(prev, f.label, e.shiftKey || e.altKey),
                    )
                  }
                >
                  <HeadphonesIcon size={14} aria-hidden />
                </Button>
                <ExternalLink
                  href={f.url}
                  aria-label={`Download ${f.label}`}
                  className="text-foreground-secondary p-1.5 no-underline"
                >
                  <DownloadIcon size={14} aria-hidden />
                </ExternalLink>
              </div>
              <audio
                ref={(el) => {
                  audioRefs.current[f.label] = el;
                }}
                src={f.url}
                preload="none"
                className="hidden"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
