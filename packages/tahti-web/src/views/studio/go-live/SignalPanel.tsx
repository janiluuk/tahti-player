import { useTranslation } from '@tahti-player/i18n';

import { fetchSignalStatus, mockSimulateSignal } from '../../../api/broadcast';
import { SignalCheckWidget } from '../../../components/SignalCheckWidget';
import { StudioPanel } from '../../../components/StudioPanel';
import { webT } from '../../../lib/webT';
import { BroadcastUsageMeter } from './BroadcastUsageMeter';
import { formatClockTime } from './goLiveTime';
import type { GoLiveState } from './useGoLiveState';

/** Screen readers hear when the encoder connects or drops; sighted users
 * see it in the panel title and the status chip. */
export function signalAnnouncement(
  isBroadcastLive: boolean,
  signalOk: boolean,
  blocked: boolean | undefined,
): string {
  const t = webT();
  if (isBroadcastLive) {
    return t('signalPanelStates.yourBroadcastIsOnAir');
  }
  if (!signalOk) {
    return t('signalPanelStates.noSignalFromYourEncoder');
  }
  return blocked
    ? t('signalPanelStates.signalReceivedButYourBroadcast')
    : t('signalPanelStates.signalReceivedYouCanGo');
}

export function SignalPanel({ state }: { state: GoLiveState }) {
  const { t } = useTranslation('web');
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
    reconnecting,
    reconnectDeadline,
    signalOk,
    usage,
  } = state;

  const title = reconnecting
    ? t('goLivePage.encoder.reconnectingTitle')
    : isBroadcastLive
      ? t('goLivePage.encoder.onAirTitle')
      : rotationPlaying && signalOk
        ? t('goLivePage.encoder.takeOverTitle')
        : signalOk
          ? t('signalPanelStates.signalReady')
          : t('signalPanelStates.startYourEncoder');

  return (
    <StudioPanel
      title={title}
      description={
        signalOk && !reconnecting
          ? `${signal?.codec ?? t('goLivePage.encoder.audio')}${signal?.bitrateKbps != null ? ` · ${signal.bitrateKbps} kbps` : ''}`
          : t('goLivePage.encoder.startStreaming')
      }
    >
      <p className="sr-only" role="status" data-testid="signal-announcement">
        {signalAnnouncement(isBroadcastLive, signalOk, usage?.blocked)}
      </p>
      {reconnecting ? (
        <p
          role="alert"
          className="border-accent-red text-foreground mb-4 rounded-lg border px-3 py-2 text-sm"
        >
          {reconnectDeadline
            ? t('goLivePage.encoder.reconnectBy', {
                time: formatClockTime(reconnectDeadline),
              })
            : t('goLivePage.encoder.reconnectSoon')}
        </p>
      ) : null}
      {usage ? <BroadcastUsageMeter usage={usage} /> : null}
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
