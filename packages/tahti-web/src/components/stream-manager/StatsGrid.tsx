import {
  ActivityIcon,
  ListMusicIcon,
  MonitorPlayIcon,
  RadioIcon,
  TimerIcon,
  UsersIcon,
  WifiIcon,
  WifiOffIcon,
} from 'lucide-react';

import { StatChip } from '@tahti-player/ui';

import {
  formatRemaining,
  type StreamManagerState,
} from './useStreamManagerState';

export function StatsGrid({ state }: { state: StreamManagerState }) {
  const {
    rotationPlaying,
    signal,
    stats,
    signalConnected,
    signalError,
    bitrate,
    liveActive,
    overlayShowTitle,
    setOverlayModalOpen,
    listeners,
    liveDurationSec,
    outputLabel,
  } = state;

  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      role="group"
      aria-label="Live stream status"
    >
      <StatChip
        icon={
          rotationPlaying ? (
            <ListMusicIcon size={14} aria-hidden />
          ) : (
            <RadioIcon size={14} aria-hidden />
          )
        }
        label="Mode"
        value={outputLabel}
      />
      <StatChip
        icon={
          signalConnected ? (
            <WifiIcon size={14} className="text-primary" aria-hidden />
          ) : (
            <WifiOffIcon size={14} aria-hidden />
          )
        }
        label="Signal"
        value={
          signal == null && stats == null
            ? '—'
            : signalConnected
              ? 'Connected'
              : signalError
                ? 'Unavailable'
                : rotationPlaying
                  ? 'Offline'
                  : 'No encoder'
        }
      />
      <StatChip
        icon={<ActivityIcon size={14} aria-hidden />}
        label="Bitrate"
        value={
          bitrate != null
            ? `${bitrate} kbps`
            : rotationPlaying
              ? 'N/A — rotation'
              : liveActive
                ? 'Detecting…'
                : '—'
        }
      />
      <StatChip
        icon={<MonitorPlayIcon size={14} aria-hidden />}
        label="Overlay"
        value={overlayShowTitle == null ? '—' : overlayShowTitle ? 'On' : 'Off'}
        role="button"
        tabIndex={0}
        aria-label="Open stream overlay settings"
        className="hover:border-primary cursor-pointer"
        onClick={() => setOverlayModalOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOverlayModalOpen(true);
          }
        }}
      />
      <StatChip
        icon={<UsersIcon size={14} aria-hidden />}
        label="Listeners"
        value={
          listeners == null && stats?.listenerPeak == null
            ? '—'
            : `${listeners ?? 0} / ${stats?.listenerPeak ?? 0}`
        }
      />
      <StatChip
        icon={<TimerIcon size={14} aria-hidden />}
        label="Live for"
        value={
          liveDurationSec != null
            ? formatRemaining(liveDurationSec)
            : liveActive
              ? 'Starting…'
              : '—'
        }
      />
    </div>
  );
}
