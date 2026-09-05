import { Link } from '@tanstack/react-router';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CircleDotIcon,
  EyeIcon,
  EyeOffIcon,
  FolderOpenIcon,
  HeadphonesIcon,
  ListMusicIcon,
  PlusIcon,
  RadioIcon,
  Settings2Icon,
  Trash2Icon,
  VideoIcon,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  CopyButton,
  Dialog,
  Toggle,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  createRtmpTarget,
  deleteRtmpTarget,
  fetchBroadcastPreflight,
  fetchBroadcastUsage,
  fetchRtmpTargets,
  fetchSignalStatus,
  fetchStreamSettings,
  getMockChannelState,
  liveChannelPlayable,
  mockSimulateSignal,
  patchBroadcastPreflight,
  patchRtmpTarget,
  postGoLive,
  type BroadcastPreflight,
  type BroadcastUsage,
  type RtmpTarget,
  type SignalStatus,
  type StreamSettings,
} from '../../api/broadcast';
import {
  BroadcastPreflightPanel,
  ShowInfoConfirmed,
} from '../../components/BroadcastPreflightPanel';
import { ChannelShareButton } from '../../components/ChannelShareButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { MulticastDestinationForm } from '../../components/MulticastDestinationForm';
import { ObsPresetButton } from '../../components/ObsPresetButton';
import { SignalCheckWidget } from '../../components/SignalCheckWidget';
import { StreamManagerPanel } from '../../components/StreamManagerPanel';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';
import { OnAirBadge } from '../../components/tahti/OnAirBadge';
import {
  multicastProviderLabel,
  type MulticastProviderId,
} from '../../plugins/multicast';
import { useAuthStore } from '../../stores/authStore';
import { useBroadcastPresenceStore } from '../../stores/broadcastPresenceStore';
import { usePlayerStore } from '../../stores/playerStore';

type Ingest = 'obs' | 'icecast' | 'traktor';

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
  const user = useAuthStore((state) => state.user);
  const refresh = useAuthStore((state) => state.refresh);
  const play = usePlayerStore((state) => state.play);
  const playbackStatus = usePlayerStore((state) => state.status);
  const currentId = usePlayerStore((state) => state.currentId);
  const setPlaybackStatus = usePlayerStore((state) => state.setStatus);
  const analyser = usePlayerStore((state) => state.analyser);

  const [settings, setSettings] = useState<StreamSettings | null>(null);
  const [signal, setSignal] = useState<SignalStatus | null>(null);
  const [usage, setUsage] = useState<BroadcastUsage | null>(null);
  const [targets, setTargets] = useState<RtmpTarget[]>([]);
  const [channelState, setChannelState] = useState(
    user?.channel?.state ?? 'OFFLINE',
  );
  const [rotationPlaying, setRotationPlaying] = useState(false);
  const [ingest, setIngest] = useState<Ingest>('obs');
  const [credentialsExpanded, setCredentialsExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [newProvider, setNewProvider] = useState<MulticastProviderId>('TWITCH');
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newRtmpUrl, setNewRtmpUrl] = useState('');
  const [showAddDestination, setShowAddDestination] = useState(false);
  const [recordEnabled, setRecordEnabled] = useState(true);
  const [recordBusy, setRecordBusy] = useState(false);
  const [preflight, setPreflight] = useState<BroadcastPreflight | null>(null);
  const [showInfoConfirmed, setShowInfoConfirmed] = useState(false);
  const [pendingDeleteTarget, setPendingDeleteTarget] =
    useState<RtmpTarget | null>(null);

  const slug = user?.channel?.slug ?? '';
  const displayName = user?.displayName ?? slug;
  const streamPlayableId = `live:${slug}`;
  const isMock = import.meta.env.VITE_FORCE_MOCK === '1';
  const isBroadcastLive = channelState === 'LIVE' && Boolean(signal?.connected);
  const isPreview = channelState === 'PREVIEW';
  const signalOk = Boolean(signal?.connected) || isPreview;
  const isStreamPlaying =
    currentId === streamPlayableId &&
    (playbackStatus === 'playing' || playbackStatus === 'loading');
  const isPreviewListening =
    currentId === streamPlayableId && playbackStatus === 'playing';

  const patchLocalChannel = useCallback((state: string) => {
    setChannelState(state);
    useAuthStore.setState((current) => {
      if (!current.user?.channel) {
        return current;
      }
      return {
        user: {
          ...current.user,
          channel: { ...current.user.channel, state },
        },
      };
    });
  }, []);

  const reload = useCallback(async () => {
    const [settingsResult, usageResult, targetResult, preflightResult] =
      await Promise.all([
        fetchStreamSettings(),
        fetchBroadcastUsage(),
        fetchRtmpTargets(),
        fetchBroadcastPreflight(),
      ]);
    setSettings(settingsResult.data);
    setUsage(usageResult.data);
    setTargets(targetResult.data);
    setPreflight(preflightResult.data);
    setRecordEnabled(preflightResult.data?.autoArchive ?? true);
    if (
      !settingsResult.data &&
      settingsResult.meta.source === 'api' &&
      settingsResult.meta.reason
    ) {
      setMessage(
        `Stream settings: ${settingsResult.meta.reason} — log in as an artist with a channel.`,
      );
    }
    if (isMock) {
      setChannelState(getMockChannelState());
    }
  }, [isMock]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (user?.channel?.state && !isMock) {
      setChannelState(user.channel.state);
    }
  }, [user?.channel?.state, isMock]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const { data } = await fetchSignalStatus();
      if (!cancelled) {
        setSignal(data);
        useBroadcastPresenceStore
          .getState()
          .setSignalConnected(Boolean(data.connected));
      }
      if (!isMock) {
        await refresh();
      } else {
        setChannelState(getMockChannelState());
      }
    };
    void tick();
    const intervalId = window.setInterval(() => void tick(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [refresh, isMock]);

  const playStream = () => {
    if (!settings || !slug) {
      return;
    }
    play(liveChannelPlayable(slug, displayName, settings.hlsUrl));
  };

  const toggleStreamPlayback = () => {
    if (currentId !== streamPlayableId) {
      playStream();
      return;
    }
    setPlaybackStatus(isStreamPlaying ? 'paused' : 'playing');
  };

  const onGoLive = async () => {
    setBusy(true);
    setMessage(null);
    const result = await postGoLive();
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    patchLocalChannel('LIVE');
    setMessage('You’re live. The rotation has handed over to your broadcast.');
    playStream();
    if (!isMock) {
      void refresh();
    }
  };

  const handleStreamEnded = () => {
    patchLocalChannel('OFFLINE');
    setMessage('Broadcast ended. Your configured rotation can resume.');
    if (!isMock) {
      void refresh();
    }
  };

  const toggleRecording = async () => {
    const next = !recordEnabled;
    setRecordEnabled(next);
    setRecordBusy(true);
    setMessage(null);
    const result = await patchBroadcastPreflight({ autoArchive: next });
    setRecordBusy(false);
    if ('error' in result) {
      setRecordEnabled(!next);
      setMessage(result.error);
    }
  };

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
        <StudioNav current="/studio/go-live" />

        <ViewShell title="Go live" classes={{ root: 'px-0 pt-0' }}>
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

          {settings && slug && (
            <StreamManagerPanel
              slug={slug}
              channelState={channelState}
              isPlaying={isStreamPlaying}
              onPlaybackToggle={toggleStreamPlayback}
              onEnded={handleStreamEnded}
              onRotationChange={setRotationPlaying}
            />
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
                    !isBroadcastLive ? (
                      <Button
                        disabled={busy || !signalOk || usage?.blocked}
                        onClick={() => void onGoLive()}
                      >
                        <RadioIcon size={16} aria-hidden className="mr-1.5" />
                        {busy
                          ? 'Going live…'
                          : rotationPlaying
                            ? 'Take over rotation'
                            : 'Go Live'}
                      </Button>
                    ) : undefined
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
                  description={
                    credentialsExpanded
                      ? 'Choose your app, then copy the matching credentials.'
                      : undefined
                  }
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
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">
                              Ready-made OBS setup
                            </p>
                            <p className="text-foreground-secondary mt-1 text-xs">
                              Download a preset containing this channel&apos;s
                              scene and current stream credentials.
                            </p>
                          </div>
                          <ObsPresetButton
                            channelName={displayName}
                            channelSlug={slug}
                            server={settings.rtmp.server}
                            streamKey={settings.rtmp.streamKey}
                          />
                        </div>
                      ) : null}
                      <div className="text-foreground-secondary mt-4 flex items-start gap-2 text-xs">
                        <Settings2Icon
                          size={14}
                          className="mt-0.5 shrink-0"
                          aria-hidden
                        />
                        {ingest === 'obs'
                          ? 'In OBS, open Settings → Stream → Custom, paste both values, then choose Start Streaming.'
                          : 'Paste these values into the broadcasting section of your audio app, then enable its On Air control.'}
                      </div>
                    </>
                  )}
                </StudioPanel>
              </div>

              <div className="flex min-w-0 flex-col gap-5">
                <StudioPanel
                  title="Recording"
                  description="Save this and future broadcasts to your recordings archive."
                >
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
                    to="/studio/recordings"
                    aria-label="Open recordings"
                    className="text-foreground-secondary mt-3 inline-flex items-center gap-1.5 text-xs underline-offset-2 hover:underline"
                  >
                    <FolderOpenIcon size={14} aria-hidden />
                    Edit and release saved recordings
                  </Link>
                </StudioPanel>

                <StudioPanel
                  title="Multistream"
                  description="Mirror your broadcast to other platforms."
                  action={
                    <Tooltip content="Add destination" side="top">
                      <Button
                        size="icon-sm"
                        variant="secondary"
                        onClick={() => setShowAddDestination(true)}
                        aria-label="Add destination"
                      >
                        <PlusIcon size={16} />
                      </Button>
                    </Tooltip>
                  }
                >
                  {targets.length === 0 ? (
                    <p className="text-foreground-secondary text-sm">
                      No destinations configured.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {targets.map((target) => (
                        <li
                          key={target.id}
                          className="border-border rounded-lg border px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {target.label ||
                                  multicastProviderLabel(target.provider)}
                              </p>
                              <p className="text-foreground-secondary text-xs">
                                {target.enabled ? 'Enabled' : 'Disabled'} · …
                                {target.keyLast4 ?? '????'}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  void patchRtmpTarget(target.id, {
                                    enabled: !target.enabled,
                                  }).then(() => reload());
                                }}
                              >
                                {target.enabled ? 'Disable' : 'Enable'}
                              </Button>
                              <Tooltip content="Remove destination" side="top">
                                <Button
                                  size="icon-sm"
                                  variant="text"
                                  onClick={() => setPendingDeleteTarget(target)}
                                  aria-label={`Remove ${target.label || target.provider}`}
                                >
                                  <Trash2Icon size={14} aria-hidden />
                                </Button>
                              </Tooltip>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </StudioPanel>
              </div>
            </div>
          </>

          <Dialog.Root
            isOpen={showAddDestination}
            onClose={() => {
              setShowAddDestination(false);
              setNewKey('');
              setNewLabel('');
              setNewRtmpUrl('');
            }}
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                event.preventDefault();
              }}
            >
              <Dialog.Title>
                <span className="inline-flex items-center gap-2">
                  <ListMusicIcon size={18} aria-hidden />
                  Add multistream destination
                </span>
              </Dialog.Title>
              <div className="mt-4">
                <MulticastDestinationForm
                  provider={newProvider}
                  label={newLabel}
                  streamKey={newKey}
                  rtmpUrl={newRtmpUrl}
                  onProviderChange={setNewProvider}
                  onLabelChange={setNewLabel}
                  onStreamKeyChange={setNewKey}
                  onRtmpUrlChange={setNewRtmpUrl}
                  submitLabel="Save destination"
                  onSubmit={() => {
                    void createRtmpTarget({
                      provider: newProvider,
                      streamKey: newKey.trim(),
                      label: newLabel.trim() || undefined,
                      rtmpUrl: newRtmpUrl.trim() || undefined,
                      enabled: true,
                    }).then((result) => {
                      if (!result.ok) {
                        setMessage(result.error);
                        return;
                      }
                      setNewKey('');
                      setNewLabel('');
                      setNewRtmpUrl('');
                      setShowAddDestination(false);
                      void reload();
                    });
                  }}
                />
              </div>
              <Dialog.Actions>
                <Dialog.Close>Cancel</Dialog.Close>
              </Dialog.Actions>
            </form>
          </Dialog.Root>
          <ConfirmDialog
            isOpen={pendingDeleteTarget !== null}
            title={
              pendingDeleteTarget
                ? `Remove ${pendingDeleteTarget.label || pendingDeleteTarget.provider}?`
                : 'Remove destination?'
            }
            description="This deletes the saved stream key."
            confirmLabel="Remove"
            onCancel={() => setPendingDeleteTarget(null)}
            onConfirm={() => {
              const target = pendingDeleteTarget;
              setPendingDeleteTarget(null);
              if (!target) {
                return;
              }
              void deleteRtmpTarget(target.id).then((result) => {
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success('Destination removed.');
                reload();
              });
            }}
          />
        </ViewShell>
      </div>
    </StudioGate>
  );
}
