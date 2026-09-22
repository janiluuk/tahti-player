import { Link } from '@tanstack/react-router';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CircleDotIcon,
  EyeIcon,
  EyeOffIcon,
  FolderOpenIcon,
  HeadphonesIcon,
  RadioIcon,
  VideoIcon,
} from 'lucide-react';
import { useState } from 'react';

import {
  Badge,
  Button,
  CopyButton,
  Dialog,
  Toggle,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import { fetchSignalStatus, mockSimulateSignal } from '../../api/broadcast';
import {
  BroadcastPreflightPanel,
  ShowInfoConfirmed,
} from '../../components/BroadcastPreflightPanel';
import { ChannelShareButton } from '../../components/ChannelShareButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { HelpLayer } from '../../components/HelpLayer';
import { ObsPresetButton } from '../../components/ObsPresetButton';
import { SignalCheckWidget } from '../../components/SignalCheckWidget';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { OnAirBadge } from '../../components/tahti/OnAirBadge';
import { usePlayerStore } from '../../stores/playerStore';
import { MultistreamPanel } from './go-live/MultistreamPanel';
import { useGoLiveState } from './go-live/useGoLiveState';

// System rule: any field displaying a value meant to be copied (URLs,
// stream keys, credentials) pairs a visible <code> with the shared
// CopyButton (@tahti-player/ui) — this used to hand-roll the same
// check-icon-swap CopyButton already provides. See WORKPLAN.md's
// URL-field copy convention entry.
function CopyField({
  label,
  value,
  maskable = false,
}: {
  label: string;
  value: string;
  /** Starts hidden behind dots with a reveal toggle — for secrets
   * (stream keys, passwords) rather than public-facing values (server
   * host, mount point). */
  maskable?: boolean;
}) {
  const [revealed, setRevealed] = useState(!maskable);
  return (
    <div className="border-border bg-background-secondary flex flex-col gap-1 rounded-lg border p-3">
      <div className="text-foreground-secondary font-mono text-xs tracking-wide uppercase">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <code className="text-foreground flex-1 overflow-x-auto font-mono text-sm whitespace-nowrap">
          {revealed ? value : '•'.repeat(Math.min(value.length, 24))}
        </code>
        {maskable && (
          <Tooltip content={revealed ? `Hide ${label}` : `Show ${label}`}>
            <Button
              size="icon-sm"
              variant="secondary"
              onClick={() => setRevealed((current) => !current)}
              aria-label={revealed ? `Hide ${label}` : `Show ${label}`}
            >
              {revealed ? (
                <EyeOffIcon size={14} aria-hidden />
              ) : (
                <EyeIcon size={14} aria-hidden />
              )}
            </Button>
          </Tooltip>
        )}
        <CopyButton
          text={value}
          variant="secondary"
          toastMessage={`${label} copied.`}
          aria-label={`Copy ${label}`}
        />
      </div>
    </div>
  );
}

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
  const {
    settings,
    signal,
    setSignal,
    usage,
    targets,
    channelState,
    setChannelState,
    ingest,
    setIngest,
    credentialsExpanded,
    setCredentialsExpanded,
    busy,
    message,
    confirmGoLive,
    setConfirmGoLive,
    recordEnabled,
    recordBusy,
    preflight,
    showInfoConfirmed,
    setShowInfoConfirmed,
    showInfoModalOpen,
    setShowInfoModalOpen,
    slug,
    displayName,
    isMock,
    isBroadcastLive,
    rotationPlaying,
    signalOk,
    isPreviewListening,
    showInfoReady,
    reload,
    toggleStreamPlayback,
    onGoLive,
    toggleRecording,
  } = useGoLiveState();

  const analyser = usePlayerStore((state) => state.analyser);

  const renderCredentials = () => {
    if (!settings) {
      return (
        <p className="text-foreground-secondary text-sm">
          Stream settings could not be loaded.
        </p>
      );
    }
    if (ingest === 'obs') {
      return (
        <div className="flex flex-col gap-2">
          <CopyField label="Server" value={settings.rtmp.server} />
          <CopyField label="Stream key" value={settings.rtmp.streamKey} />
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        <CopyField label="Server" value={settings.icecast.server} />
        <CopyField label="Mount" value={settings.icecast.mount} />
        <CopyField label="Password" value={settings.icecast.password} />
      </div>
    );
  };

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
                        <Badge
                          variant="dot"
                          color={showInfoReady ? 'green' : 'yellow'}
                        />
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
                      void fetchSignalStatus().then((result) =>
                        setSignal(result.data),
                      );
                    }}
                  />
                </StudioPanel>

                <StudioPanel
                  title="Connect broadcasting software"
                  action={
                    <Tooltip
                      content={
                        credentialsExpanded
                          ? 'Hide broadcasting options'
                          : 'Show broadcasting options'
                      }
                    >
                      <Button
                        size="icon-sm"
                        variant="secondary"
                        onClick={() =>
                          setCredentialsExpanded((current) => !current)
                        }
                        aria-label={
                          credentialsExpanded
                            ? 'Hide broadcasting options'
                            : 'Show broadcasting options'
                        }
                        aria-expanded={credentialsExpanded}
                      >
                        {credentialsExpanded ? (
                          <ChevronUpIcon size={16} aria-hidden />
                        ) : (
                          <ChevronDownIcon size={16} aria-hidden />
                        )}
                      </Button>
                    </Tooltip>
                  }
                >
                  {settings && (
                    <div className="flex flex-col gap-2">
                      <CopyField label="Server" value={settings.rtmp.server} />
                      <CopyField
                        label="Stream key"
                        value={settings.rtmp.streamKey}
                        maskable
                      />
                    </div>
                  )}
                  {credentialsExpanded && (
                    <>
                      <div className="mt-4 mb-4 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={ingest === 'obs' ? 'default' : 'secondary'}
                          onClick={() => setIngest('obs')}
                        >
                          <VideoIcon size={14} aria-hidden className="mr-1.5" />
                          OBS
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            ingest === 'traktor' ? 'default' : 'secondary'
                          }
                          onClick={() => setIngest('traktor')}
                        >
                          <HeadphonesIcon
                            size={14}
                            aria-hidden
                            className="mr-1.5"
                          />
                          Traktor
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            ingest === 'icecast' ? 'default' : 'secondary'
                          }
                          onClick={() => setIngest('icecast')}
                        >
                          <RadioIcon size={14} aria-hidden className="mr-1.5" />
                          Icecast
                        </Button>
                      </div>
                      {renderCredentials()}
                      {ingest === 'obs' && settings && slug ? (
                        <div className="border-border bg-background-secondary/40 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                          <p className="text-sm font-semibold">
                            Ready-made OBS setup
                          </p>
                          <ObsPresetButton
                            channelName={displayName}
                            channelSlug={slug}
                            server={settings.rtmp.server}
                            streamKey={settings.rtmp.streamKey}
                          />
                        </div>
                      ) : null}
                    </>
                  )}
                </StudioPanel>
              </div>

              <div className="flex min-w-0 flex-col gap-5">
                <StudioPanel title="Recording">
                  <div className="border-border bg-background flex w-full items-center gap-3 rounded-lg border p-3">
                    <CircleDotIcon
                      size={20}
                      aria-hidden
                      className={
                        recordEnabled
                          ? 'fill-accent-red text-accent-red'
                          : 'text-foreground-secondary'
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">
                        Record broadcast
                      </span>
                      <span className="text-foreground-secondary block text-xs">
                        {recordEnabled
                          ? 'On · saved when the broadcast ends'
                          : 'Off · this broadcast will not be saved'}
                      </span>
                    </span>
                    <Toggle
                      label="Record broadcast"
                      checked={recordEnabled}
                      disabled={recordBusy}
                      onChange={() => void toggleRecording()}
                    />
                  </div>
                  <Link
                    to="/library/recordings"
                    aria-label="Open recordings"
                    className="text-foreground-secondary mt-3 inline-flex items-center gap-1.5 text-xs underline-offset-2 hover:underline"
                  >
                    <FolderOpenIcon size={14} aria-hidden />
                    Edit and release saved recordings
                  </Link>
                </StudioPanel>

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
