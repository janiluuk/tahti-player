import { Music, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button, Tooltip } from '@tahti-player/ui';

import { usePlayerStore } from '../../stores/playerStore';

export const BACKGROUND_MUSIC_VOLUME = 0.25;

export function ArtistBackgroundMusicButton({
  url,
  artistName,
  className,
}: {
  url: string | null | undefined;
  artistName: string;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setPlaying(false);
    return () => {
      const audio = audioRef.current;
      audioRef.current = null;
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
      }
    };
  }, [url]);

  useEffect(
    () =>
      usePlayerStore.subscribe((state, prev) => {
        const started =
          (state.status === 'playing' || state.status === 'loading') &&
          state.status !== prev.status;
        if (started && audioRef.current) {
          audioRef.current.pause();
          setPlaying(false);
        }
      }),
    [],
  );

  if (!url) {
    return null;
  }

  const toggle = () => {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio(url);
      audio.loop = true;
      audio.volume = BACKGROUND_MUSIC_VOLUME;
      audioRef.current = audio;
    }
    setPlaying(true);
    void audio.play()?.catch(() => {
      setPlaying(false);
    });
  };

  const label = playing
    ? `Mute ${artistName}'s background music`
    : `Play ${artistName}'s background music`;

  return (
    <Tooltip content={label} side="top">
      <Button
        size="icon-sm"
        variant="secondary"
        aria-label={label}
        className={className}
        onClick={toggle}
        data-testid="artist-background-music-button"
      >
        {playing ? (
          <VolumeX size={16} aria-hidden />
        ) : (
          <Music size={16} aria-hidden />
        )}
      </Button>
    </Tooltip>
  );
}
