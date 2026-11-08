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

import { useTranslation } from '@tahti-player/i18n';
import { StatChip } from '@tahti-player/ui';

import {
  formatRemaining,
  type StreamManagerState,
} from './useStreamManagerState';

export function StatsGrid({ state }: { state: StreamManagerState }) {
  const { t } = useTranslation('web');
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
      aria-label={t('streamStats.liveStreamStatus')}
    >
      <StatChip
        icon={
          rotationPlaying ? (
            <ListMusicIcon size={14} aria-hidden />
          ) : (
            <RadioIcon size={14} aria-hidden />
          )
        }
        label={t('streamStats.mode')}
        value={outputLabel}
      />
      <StatChip
        icon={
          signalConnected ? (
            <WifiIcon size={14} className="text-primary-strong" aria-hidden />
          ) : (
            <WifiOffIcon size={14} aria-hidden />
          )
        }
        label={t('streamStats.signal')}
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
        label={t('streamStats.bitrate')}
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
        label={t('streamStats.overlay')}
        value={overlayShowTitle == null ? '—' : overlayShowTitle ? 'On' : 'Off'}
        aria-label={t('streamStats.openStreamOverlaySettings')}
        onClick={() => setOverlayModalOpen(true)}
      />
      <StatChip
        icon={<UsersIcon size={14} aria-hidden />}
        label={t('streamStats.listeners')}
        value={
          listeners == null && stats?.listenerPeak == null
            ? '—'
            : `${listeners ?? 0} / ${stats?.listenerPeak ?? 0}`
        }
      />
      <StatChip
        icon={<TimerIcon size={14} aria-hidden />}
        label={t('streamStats.liveFor')}
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
