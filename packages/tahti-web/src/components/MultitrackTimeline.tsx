import {
  ChevronDownIcon,
  ChevronUpIcon,
  MinusIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  Trash2Icon,
  Volume2Icon,
  VolumeXIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button, Slider } from '@tahti-player/ui';

import type {
  EditorSource,
  EditorTimeline,
  EditorTimelineClip,
  EditorTimelineTrack,
} from '../api/studio-types';

export const TIMELINE_COLORS = [
  '#6ee7b7',
  '#93c5fd',
  '#f9a8d4',
  '#fcd34d',
  '#c4b5fd',
];

export function clampTimelineDuration(
  durationSec: number,
  sourceDuration?: number | null,
) {
  const maximum =
    sourceDuration && sourceDuration > 0
      ? sourceDuration
      : Number.POSITIVE_INFINITY;
  return Math.max(0.001, Math.min(durationSec, maximum));
}

export function normalizeTimeline(
  value: unknown,
  source?: EditorSource,
): EditorTimeline {
  const candidate = value as Partial<EditorTimeline> | null;
  const duration = Number(candidate?.durationSec) || source?.durationSec || 180;
  const tracks = Array.isArray(candidate?.tracks) ? candidate.tracks : [];
  if (tracks.length) {
    return {
      version: 1,
      durationSec: Math.max(duration, 0.001),
      tracks: tracks as EditorTimelineTrack[],
    };
  }
  if (!source) {
    return { version: 1, durationSec: Math.max(duration, 0.001), tracks: [] };
  }
  return {
    version: 1,
    durationSec: Math.max(duration, source.durationSec ?? 0.001),
    tracks: [
      {
        id: 'track-1',
        name: 'Archive track',
        color: TIMELINE_COLORS[0]!,
        gainDb: 0,
        muted: false,
        solo: false,
        clips: [
          {
            id: 'clip-1',
            sourceSoundId: source.sourceKey ?? source.title,
            startSec: 0,
            sourceOffsetSec: 0,
            durationSec: source.durationSec ?? duration,
          },
        ],
      },
    ],
  };
}

export function serializeTimeline(timeline: EditorTimeline): EditorTimeline {
  return {
    version: 1,
    durationSec: Math.max(0.001, timeline.durationSec),
    tracks: timeline.tracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) => ({
        ...clip,
        startSec: Math.max(0, clip.startSec),
        sourceOffsetSec: Math.max(0, clip.sourceOffsetSec),
        durationSec: Math.max(0.001, clip.durationSec),
      })),
    })),
  };
}

export function moveTimelineClip(
  timeline: EditorTimeline,
  trackId: string,
  clipId: string,
  startSec: number,
): EditorTimeline {
  return {
    ...timeline,
    tracks: timeline.tracks.map((track) =>
      track.id !== trackId
        ? track
        : {
            ...track,
            clips: track.clips.map((clip) =>
              clip.id !== clipId
                ? clip
                : {
                    ...clip,
                    startSec: Math.max(
                      0,
                      Math.min(
                        startSec,
                        timeline.durationSec - clip.durationSec,
                      ),
                    ),
                  },
            ),
          },
    ),
  };
}

export function reorderTimelineTracks(
  timeline: EditorTimeline,
  trackId: string,
  direction: 'up' | 'down',
) {
  const index = timeline.tracks.findIndex((track) => track.id === trackId);
  const nextIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || nextIndex < 0 || nextIndex >= timeline.tracks.length) {
    return timeline;
  }
  const tracks = [...timeline.tracks];
  [tracks[index], tracks[nextIndex]] = [tracks[nextIndex]!, tracks[index]!];
  return { ...timeline, tracks };
}

export function toggleTimelineTrack(
  timeline: EditorTimeline,
  trackId: string,
  mode: 'mute' | 'solo',
) {
  return {
    ...timeline,
    tracks: timeline.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            [mode === 'mute' ? 'muted' : 'solo']:
              !track[mode === 'mute' ? 'muted' : 'solo'],
          }
        : track,
    ),
  };
}

type Props = {
  value: EditorTimeline;
  sources: EditorSource[];
  onChange: (value: EditorTimeline) => void;
  unavailableSourceIds?: string[];
};

export const MultitrackTimeline = ({
  value,
  sources,
  onChange,
  unavailableSourceIds = [],
}: Props) => {
  const [zoom, setZoom] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const drag = useRef<{
    trackId: string;
    clip: EditorTimelineClip;
    x: number;
  } | null>(null);
  const audio = useRef(new Map<string, HTMLAudioElement>());
  const soloActive = value.tracks.some((track) => track.solo);
  const pixelsPerSecond = 8 * zoom;
  const sourceMap = useMemo(
    () =>
      new Map(
        sources.map((source) => [source.sourceKey ?? source.title, source]),
      ),
    [sources],
  );

  useEffect(() => {
    sources.forEach((source) => {
      const key = source.sourceKey ?? source.title;
      if (!audio.current.has(key) && source.url) {
        audio.current.set(key, new Audio(source.url));
      }
    });
    return () => {
      audio.current.forEach((element) => element.pause());
    };
  }, [sources]);
  useEffect(() => {
    audio.current.forEach((element, key) => {
      const track = value.tracks.find((item) =>
        item.clips.some((clip) => clip.sourceSoundId === key),
      );
      const clip = track?.clips.find(
        (item) =>
          currentTime >= item.startSec &&
          currentTime < item.startSec + item.durationSec,
      );
      element.volume =
        clip && track && !track.muted && (!soloActive || track.solo)
          ? Math.pow(10, track.gainDb / 20)
          : 0;
      if (playing) {
        if (clip) {
          const sourceTime = clip.sourceOffsetSec + currentTime - clip.startSec;
          if (Math.abs(element.currentTime - sourceTime) > 0.25) {
            element.currentTime = sourceTime;
          }
          void element.play().catch(() => setPlaying(false));
        } else {
          element.pause();
        }
      } else {
        element.pause();
      }
    });
  }, [currentTime, playing, soloActive, value.tracks]);
  useEffect(() => {
    if (!playing) {
      return;
    }
    const timer = window.setInterval(
      () =>
        setCurrentTime((time) => {
          const next = Math.min(value.durationSec, time + 0.1);
          if (next >= value.durationSec) {
            setPlaying(false);
          }
          return next;
        }),
      100,
    );
    return () => window.clearInterval(timer);
  }, [playing, value.durationSec]);
  const setTime = (time: number) => {
    const next = Math.max(0, Math.min(time, value.durationSec));
    setCurrentTime(next);
    audio.current.forEach((element) => {
      element.currentTime = next;
    });
  };
  const togglePlay = () => {
    setPlaying((current) => !current);
  };

  if (!value.tracks.length || !sources.length) {
    return (
      <div
        data-testid="multitrack-empty"
        className="border-border text-foreground-secondary rounded-lg border border-dashed p-10 text-center"
      >
        Add a native archive source to begin a session.
      </div>
    );
  }
  return (
    <div
      data-testid="multitrack-timeline"
      className="border-border bg-background-secondary/30 overflow-hidden rounded-xl border"
    >
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <Button
          size="sm"
          onClick={togglePlay}
          aria-label={playing ? 'Pause preview' : 'Play preview'}
        >
          {playing ? <PauseIcon size={15} /> : <PlayIcon size={15} />}
        </Button>
        <span className="font-mono text-xs tabular-nums">
          {formatTime(currentTime)} / {formatTime(value.durationSec)}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
          aria-label="Zoom out"
        >
          <MinusIcon size={15} />
        </Button>
        <span className="text-xs">{Math.round(zoom * 100)}%</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setZoom(Math.min(4, zoom + 0.25))}
          aria-label="Zoom in"
        >
          <PlusIcon size={15} />
        </Button>
        <div className="ml-auto w-40">
          <Slider
            min={0}
            max={value.durationSec}
            step={0.1}
            value={currentTime}
            onValueChange={setTime}
          >
            <Slider.Surface>
              <Slider.Track />
              <Slider.RangeInput />
            </Slider.Surface>
          </Slider>
        </div>
      </div>
      <div className="flex min-w-0 max-sm:flex-col">
        <div className="bg-background-secondary sticky left-0 z-10 w-52 shrink-0 border-r p-2 pt-8 max-sm:w-full max-sm:border-r-0 max-sm:border-b max-sm:pt-2">
          {value.tracks.map((track, index) => (
            <div
              key={track.id}
              className="mb-2 flex h-20 flex-col justify-between rounded border p-2 text-xs"
              style={{ borderColor: track.color }}
            >
              <div className="flex items-center gap-1">
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {track.name}
                </span>
                <button
                  aria-label={`Remove ${track.name}`}
                  onClick={() =>
                    onChange({
                      ...value,
                      tracks: value.tracks.filter(
                        (item) => item.id !== track.id,
                      ),
                    })
                  }
                >
                  <Trash2Icon size={13} />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  aria-label={`Move ${track.name} up`}
                  disabled={!index}
                  onClick={() =>
                    onChange(reorderTimelineTracks(value, track.id, 'up'))
                  }
                >
                  <ChevronUpIcon size={14} />
                </button>
                <button
                  aria-label={`Move ${track.name} down`}
                  disabled={index === value.tracks.length - 1}
                  onClick={() =>
                    onChange(reorderTimelineTracks(value, track.id, 'down'))
                  }
                >
                  <ChevronDownIcon size={14} />
                </button>
                <button
                  aria-label={`${track.muted ? 'Unmute' : 'Mute'} ${track.name}`}
                  onClick={() =>
                    onChange(toggleTimelineTrack(value, track.id, 'mute'))
                  }
                >
                  {track.muted ? (
                    <VolumeXIcon size={14} />
                  ) : (
                    <Volume2Icon size={14} />
                  )}
                </button>
                <button
                  aria-label={`${track.solo ? 'Unsolo' : 'Solo'} ${track.name}`}
                  className={track.solo ? 'text-accent-yellow font-bold' : ''}
                  onClick={() =>
                    onChange(toggleTimelineTrack(value, track.id, 'solo'))
                  }
                >
                  S
                </button>
                <button
                  aria-label={`Lower gain for ${track.name}`}
                  onClick={() =>
                    onChange({
                      ...value,
                      tracks: value.tracks.map((item) =>
                        item.id === track.id
                          ? { ...item, gainDb: Math.max(-24, item.gainDb - 1) }
                          : item,
                      ),
                    })
                  }
                >
                  −
                </button>
                <button
                  aria-label={`Raise gain for ${track.name}`}
                  onClick={() =>
                    onChange({
                      ...value,
                      tracks: value.tracks.map((item) =>
                        item.id === track.id
                          ? { ...item, gainDb: Math.min(12, item.gainDb + 1) }
                          : item,
                      ),
                    })
                  }
                >
                  +
                </button>
                <span className="ml-auto">{track.gainDb} dB</span>
              </div>
            </div>
          ))}
        </div>
        <div
          className="relative min-w-0 flex-1 overflow-x-auto"
          data-testid="timeline-scroller"
        >
          <div
            className="relative"
            style={{
              width: `${Math.max(720, value.durationSec * pixelsPerSecond)}px`,
            }}
          >
            <div className="text-foreground-secondary h-8 border-b px-2 font-mono text-[10px]">
              {Array.from(
                { length: Math.ceil(value.durationSec / 30) + 1 },
                (_, index) => (
                  <span key={index} className="mr-24 inline-block">
                    {formatTime(index * 30)}
                  </span>
                ),
              )}
            </div>
            {value.tracks.map((track) => (
              <div
                key={track.id}
                className="relative h-20 border-b bg-[repeating-linear-gradient(90deg,transparent,transparent_239px,rgba(148,163,184,.12)_240px)]"
              >
                {track.clips.map((clip) => {
                  const source = sourceMap.get(clip.sourceSoundId);
                  const unavailable =
                    unavailableSourceIds.includes(clip.sourceSoundId) ||
                    !source?.url;
                  return (
                    <button
                      key={clip.id}
                      data-testid={`clip-${clip.id}`}
                      className={`absolute top-2 h-16 overflow-hidden rounded border-2 px-2 text-left text-xs ${selectedClipId === clip.id ? 'ring-accent-yellow ring-2' : ''} ${unavailable ? 'opacity-40' : ''}`}
                      style={{
                        left: clip.startSec * pixelsPerSecond,
                        width: Math.max(70, clip.durationSec * pixelsPerSecond),
                        borderColor: track.color,
                        backgroundColor: `${track.color}33`,
                      }}
                      onClick={() => setSelectedClipId(clip.id)}
                      onPointerDown={(event) => {
                        drag.current = {
                          trackId: track.id,
                          clip,
                          x: event.clientX,
                        };
                        (event.currentTarget as HTMLElement).setPointerCapture(
                          event.pointerId,
                        );
                      }}
                      onPointerMove={(event) => {
                        if (drag.current?.clip.id === clip.id) {
                          onChange(
                            moveTimelineClip(
                              value,
                              track.id,
                              clip.id,
                              clip.startSec +
                                (event.clientX - drag.current.x) /
                                  pixelsPerSecond,
                            ),
                          );
                        }
                      }}
                      onPointerUp={() => {
                        drag.current = null;
                      }}
                    >
                      <span className="block truncate">
                        {source?.title ?? 'Unavailable source'}
                      </span>
                      <span className="font-mono text-[10px]">
                        {formatTime(clip.durationSec)}
                      </span>
                    </button>
                  );
                })}
                <div
                  className="bg-accent-yellow pointer-events-none absolute top-0 bottom-0 w-px"
                  style={{ left: currentTime * pixelsPerSecond }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')}`;
}
