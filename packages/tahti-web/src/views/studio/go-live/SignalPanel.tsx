import { RadioIcon } from 'lucide-react';

import { Badge, Button } from '@tahti-player/ui';

import { fetchSignalStatus, mockSimulateSignal } from '../../../api/broadcast';
import { SignalCheckWidget } from '../../../components/SignalCheckWidget';
import { StudioPanel } from '../../../components/StudioPanel';
import type { GoLiveState } from './useGoLiveState';

export function SignalPanel({ state }: { state: GoLiveState }) {
  const {
    signal,
    setSignal,
    analyser,
    isPreviewListening,
    toggleStreamPlayback,
    isMock,
    setChannelState,
    isBroadcastLive,
    rotationPlaying,
    signalOk,
    busy,
    usage,
    setConfirmGoLive,
    showInfoReady,
    setShowInfoModalOpen,
    preflight,
  } = state;

  return (
    <StudioPanel
      title={
        isBroadcastLive
          ? 'Your broadcast is on air'
          : rotationPlaying
            ? 'Ready to take over the rotation'
            : signalOk
              ? 'Signal ready'
              : 'Start your encoder'
      }
      description={
        signalOk
          ? `${signal?.codec ?? 'Audio'}${signal?.bitrateKbps != null ? ` · ${signal.bitrateKbps} kbps` : ''}`
          : 'Start streaming in OBS, Traktor, Mixxx, or another Icecast-compatible app.'
      }
      action={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setShowInfoModalOpen(true)}
            className="rounded-full"
          >
            <Badge variant="dot" color={showInfoReady ? 'green' : 'yellow'} />
            Show info
          </Button>
          {!isBroadcastLive ? (
            <Button
              disabled={busy || !signalOk || usage?.blocked}
              onClick={() => setConfirmGoLive(true)}
            >
              <RadioIcon size={16} aria-hidden className="mr-1.5" />
              {busy
                ? 'Going live…'
                : rotationPlaying
                  ? 'Take over rotation'
                  : 'Go Live'}
            </Button>
          ) : null}
        </div>
      }
    >
      {rotationPlaying && !isBroadcastLive && !preflight?.title ? (
        <div className="border-border bg-background-secondary flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm">
          <span className="text-foreground-secondary">
            Add your show name and details before going live.
          </span>
          <span className="text-foreground font-semibold">
            Confirm show info above
          </span>
        </div>
      ) : null}
      <SignalCheckWidget
        signal={signal}
        analyser={analyser}
        isChecking={isPreviewListening}
        onCheckAudio={toggleStreamPlayback}
        isMock={isMock}
        onTestConnection={() => {
          mockSimulateSignal(true);
          setChannelState('PREVIEW');
          void fetchSignalStatus().then((result) => setSignal(result.data));
        }}
      />
    </StudioPanel>
  );
}
