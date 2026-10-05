import { useNavigate, useRouterState } from '@tanstack/react-router';
import {
  CastIcon,
  Disc3Icon,
  KeyRoundIcon,
  MicIcon,
  RadioTowerIcon,
} from 'lucide-react';

import { Badge, Dialog, Tabs, ViewShell } from '@tahti-player/ui';

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
import {
  GO_LIVE_TABS,
  goLiveTabFromSearch,
  type GoLiveTabId,
} from './go-live/goLiveTabs';
import { GreenRoomSessionPanel } from './go-live/GreenRoomSessionPanel';
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

const TAB_META: Record<
  GoLiveTabId,
  { label: string; icon: typeof RadioTowerIcon }
> = {
  prep: { label: 'Prep', icon: RadioTowerIcon },
  credentials: { label: 'Credentials', icon: KeyRoundIcon },
  recording: { label: 'Recording', icon: Disc3Icon },
  destinations: { label: 'Destinations', icon: CastIcon },
  'green-room': { label: 'Green room', icon: MicIcon },
};

export function StudioGoLiveView() {
  const state = useGoLiveState();
  const navigate = useNavigate();
  const searchTab = useRouterState({
    select: (s) => {
      const raw = s.location.search;
      if (typeof raw === 'string') {
        return new URLSearchParams(raw).get('tab') ?? undefined;
      }
      if (raw && typeof raw === 'object' && 'tab' in raw) {
        const tab = (raw as { tab?: unknown }).tab;
        return typeof tab === 'string' ? tab : undefined;
      }
      return undefined;
    },
  });
  const activeTab = goLiveTabFromSearch(searchTab);
  const selectedIndex = GO_LIVE_TABS.indexOf(activeTab);

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

  const setTab = (tab: GoLiveTabId) => {
    void navigate({
      to: '/studio/go-live',
      search: tab === 'prep' ? {} : { tab },
      replace: true,
    });
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

          {message && (
            <p
              className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
                message.tone === 'error'
                  ? 'border-accent-red/40 bg-accent-red/10 text-foreground'
                  : 'border-border bg-background-secondary'
              }`}
              role={message.tone === 'error' ? 'alert' : 'status'}
            >
              {message.text}
            </p>
          )}

          <Tabs
            listClassName="mb-4 flex-wrap overflow-x-auto"
            selectedIndex={Math.max(0, selectedIndex)}
            onChange={(index) => {
              const next = GO_LIVE_TABS[index];
              if (next) {
                setTab(next);
              }
            }}
            items={GO_LIVE_TABS.map((id) => {
              const meta = TAB_META[id];
              const Icon = meta.icon;
              return {
                id,
                label: meta.label,
                icon: <Icon size={14} aria-hidden />,
                content:
                  id === 'prep' ? (
                    <div className="flex flex-col gap-5">
                      <HelpLayer title="How broadcasting works here">
                        <p>
                          Connect OBS, Streamlabs, Traktor, Mixxx, or another
                          Icecast-compatible app using the Server and Stream key
                          (or Mount/Password) under Credentials — pick your app
                          there to see the matching fields.
                        </p>
                        <p>
                          Using OBS? The &quot;Ready-made OBS setup&quot;
                          download under Credentials bundles a scene preset with
                          this channel&apos;s current credentials already filled
                          in.
                        </p>
                        <p>
                          Multistream mirrors your broadcast to other platforms
                          — manage destinations under Destinations. Recording
                          and green room prefs that apply to every show live in
                          Settings → Broadcast; this page is for the session in
                          progress.
                        </p>
                      </HelpLayer>

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
                      <SignalPanel state={state} />
                    </div>
                  ) : id === 'credentials' ? (
                    <BroadcastCredentialsPanel state={state} />
                  ) : id === 'recording' ? (
                    <RecordingPanel state={state} />
                  ) : id === 'destinations' ? (
                    <MultistreamPanel targets={targets} reload={reload} />
                  ) : (
                    <GreenRoomSessionPanel />
                  ),
              };
            })}
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
