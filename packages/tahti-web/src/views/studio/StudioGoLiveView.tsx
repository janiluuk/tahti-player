import { Badge, Dialog, ViewShell } from '@tahti-player/ui';

import {
  BroadcastPreflightPanel,
  ShowInfoConfirmed,
} from '../../components/BroadcastPreflightPanel';
import { ChannelShareButton } from '../../components/ChannelShareButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { HelpLayer } from '../../components/HelpLayer';
import { StudioGate } from '../../components/StudioGate';
import { OnAirBadge } from '../../components/tahti/OnAirBadge';
import { BroadcastCredentialsPanel } from './go-live/BroadcastCredentialsPanel';
import { MultistreamPanel } from './go-live/MultistreamPanel';
import { RecordingPanel } from './go-live/RecordingPanel';
import { SignalPanel } from './go-live/SignalPanel';
import { useGoLiveState } from './go-live/useGoLiveState';

function channelStateColor(state: string): 'green' | 'cyan' | 'secondary' {
  if (state === 'LIVE') {
    return 'green';
  }
  if (state === 'PREVIEW') {
    return 'cyan';
  }
  return 'secondary';
}

export function StudioGoLiveView() {
  const state = useGoLiveState();
  const {
    channelState,
    message,
    slug,
    displayName,
    isBroadcastLive,
    rotationPlaying,
    reload,
    showInfoConfirmed,
    setShowInfoConfirmed,
    showInfoModalOpen,
    setShowInfoModalOpen,
    confirmGoLive,
    setConfirmGoLive,
    onGoLive,
    targets,
  } = state;

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6">
        <ViewShell title="Broadcast" classes={{ root: 'px-0 pt-0' }}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {slug && (
              <ChannelShareButton
                channelSlug={slug}
                displayName={displayName}
              />
            )}
            {isBroadcastLive ? (
              <OnAirBadge />
            ) : rotationPlaying ? (
              <OnAirBadge label="ROTATION" />
            ) : (
              <Badge variant="pill" color={channelStateColor(channelState)}>
                {channelState}
              </Badge>
            )}
          </div>

          <HelpLayer title="How broadcasting works here" className="mb-4">
            <p>
              Connect OBS, Streamlabs, Traktor, Mixxx, or another
              Icecast-compatible app using the Server and Stream key (or
              Mount/Password) shown below — pick your app under "Connect
              broadcasting software" to see the matching fields.
            </p>
            <p>
              Using OBS? The "Ready-made OBS setup" download bundles a scene
              preset with this channel&apos;s current credentials already filled
              in, so you don&apos;t have to type them in by hand.
            </p>
            <p>
              Multistream mirrors your broadcast to other platforms like YouTube
              or Twitch at the same time — add a destination from the
              Multistream panel once you&apos;re set up.
            </p>
            <p>
              Recording saves this and future broadcasts to your recordings
              archive automatically; turn it off if you&apos;d rather not keep a
              copy.
            </p>
          </HelpLayer>

          {message && (
            <p
              className={`rounded-lg border px-3 py-2 text-sm ${
                /fail|error|could not|503|401|403/i.test(message)
                  ? 'border-accent-red/40 bg-accent-red/10 text-foreground'
                  : 'border-border bg-background-secondary'
              }`}
              role="status"
            >
              {message}
            </p>
          )}

          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-foreground-secondary text-xs font-semibold tracking-[0.16em] uppercase">
                  Before you start
                </p>
                {showInfoConfirmed && <ShowInfoConfirmed />}
              </div>
            </div>
            <BroadcastPreflightPanel
              onSaved={() => {
                setShowInfoConfirmed(true);
                void reload();
              }}
              onDirty={() => setShowInfoConfirmed(false)}
            />

            <Dialog.Root
              isOpen={showInfoModalOpen}
              onClose={() => setShowInfoModalOpen(false)}
              className="max-w-lg"
            >
              <Dialog.Title>Show info</Dialog.Title>
              <div className="mt-4">
                <BroadcastPreflightPanel
                  onSaved={() => {
                    setShowInfoConfirmed(true);
                    setShowInfoModalOpen(false);
                    void reload();
                  }}
                  onDirty={() => setShowInfoConfirmed(false)}
                />
              </div>
            </Dialog.Root>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(17rem,2fr)]">
              <div className="flex min-w-0 flex-col gap-5">
                <SignalPanel state={state} />
                <BroadcastCredentialsPanel state={state} />
              </div>

              <div className="flex min-w-0 flex-col gap-5">
                <RecordingPanel state={state} />
                <MultistreamPanel targets={targets} reload={reload} />
              </div>
            </div>
          </>
          <ConfirmDialog
            isOpen={confirmGoLive}
            title="Go live now?"
            description="Your broadcast replaces the channel rotation and listeners start hearing it immediately."
            confirmLabel="Go live"
            onCancel={() => setConfirmGoLive(false)}
            onConfirm={() => {
              setConfirmGoLive(false);
              void onGoLive();
            }}
          />
        </ViewShell>
      </div>
    </StudioGate>
  );
}
