import { useNavigate, useRouterState } from '@tanstack/react-router';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, ButtonLink, Dialog, Tabs, ViewShell } from '@tahti-player/ui';

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
  GO_LIVE_TAB_LABELS,
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

function PrepPanel({ state }: { state: ReturnType<typeof useGoLiveState> }) {
  const { t } = useTranslation('web');
  const {
    isBroadcastLive,
    showInfoConfirmed,
    setShowInfoConfirmed,
    reload,
    settings,
    signalOk,
    showInfoReady,
  } = state;

  return (
    <div className="flex flex-col gap-5">
      <HelpLayer title={t('goLive.howBroadcastingWorksHere')}>
        <p>{t('goLive.connectObsStreamlabsTraktorMixxx')}</p>
        <p>{t('goLive.usingObsTheQuotReady')}</p>
        <p>
          Multistream mirrors your broadcast to other platforms — manage
          destinations under Destinations. Recording and green room prefs that
          apply to every show live in Settings → Broadcast; this page is for the
          session in progress.
        </p>
      </HelpLayer>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-foreground-secondary text-xs font-semibold tracking-[0.16em] uppercase">
            {isBroadcastLive
              ? t('studioGoLiveViewStates.onAir')
              : t('studioGoLiveViewStates.beforeYouStart')}
          </p>
          {showInfoConfirmed && <ShowInfoConfirmed />}
        </div>
      </div>
      {isBroadcastLive ? (
        <p
          className="border-border bg-accent-green/10 text-foreground rounded-lg border px-3 py-3 text-sm"
          role="status"
        >
          {t('goLive.youReLiveEncoderAnd')}
        </p>
      ) : null}
      <ul
        className="border-border bg-background-secondary/40 flex flex-col gap-2 rounded-lg border px-3 py-3 text-sm"
        aria-label={t('goLive.prepChecklist')}
        hidden={isBroadcastLive || undefined}
      >
        <li className="flex flex-wrap items-center justify-between gap-2">
          <span>{showInfoReady ? '✓' : '○'} Show title ready</span>
          {!showInfoReady ? (
            <span className="text-foreground-secondary text-xs">
              {t('goLive.fillItInBelow')}
            </span>
          ) : null}
        </li>
        <li className="flex flex-wrap items-center justify-between gap-2">
          <span>{settings ? '✓' : '○'} Stream credentials</span>
          {!settings ? (
            <ButtonLink
              to="/studio/go-live"
              search={{ tab: 'credentials' }}
              size="sm"
              variant="secondary"
            >
              {t('goLive.openCredentials')}
            </ButtonLink>
          ) : null}
        </li>
        <li className="flex flex-wrap items-center justify-between gap-2">
          <span>{signalOk ? '✓' : '○'} Encoder signal</span>
          {!signalOk ? (
            <span className="text-foreground-secondary text-xs">
              {t('goLive.connectObsOrAnotherApp')}
            </span>
          ) : null}
        </li>
      </ul>
      <BroadcastPreflightPanel
        onSaved={() => {
          setShowInfoConfirmed(true);
          void reload();
        }}
        onDirty={() => setShowInfoConfirmed(false)}
      />
      <SignalPanel state={state} />
    </div>
  );
}

function GoLiveTabContent({
  tab,
  state,
}: {
  tab: GoLiveTabId;
  state: ReturnType<typeof useGoLiveState>;
}) {
  if (tab === 'prep') {
    return <PrepPanel state={state} />;
  }
  if (tab === 'credentials') {
    return <BroadcastCredentialsPanel state={state} />;
  }
  if (tab === 'recording') {
    return <RecordingPanel state={state} />;
  }
  if (tab === 'destinations') {
    return (
      <MultistreamPanel
        targets={state.targets}
        reload={state.reload}
        loadError={state.targetsError}
      />
    );
  }
  return <GreenRoomSessionPanel />;
}

export function StudioGoLiveView() {
  const { t } = useTranslation('web');
  const state = useGoLiveState();
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
  const navigate = useNavigate();

  const {
    channelState,
    message,
    slug,
    displayName,
    isBroadcastLive,
    rotationPlaying,
    reload,
    setShowInfoConfirmed,
    showInfoModalOpen,
    setShowInfoModalOpen,
    confirmGoLive,
    setConfirmGoLive,
    onGoLive,
  } = state;

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6">
        <ViewShell title={t('goLive.goLive')} classes={{ root: 'px-0 pt-0' }}>
          <Tabs.Root
            selectedIndex={GO_LIVE_TABS.indexOf(activeTab)}
            onChange={(index) => {
              const next = GO_LIVE_TABS[index];
              if (!next) {
                return;
              }
              void navigate({
                to: '/studio/go-live',
                search: next === 'prep' ? {} : { tab: next },
              });
            }}
          >
            <Tabs.List
              aria-label={t('goLive.goLiveSession')}
              className="mb-4 w-fit flex-wrap"
            >
              {GO_LIVE_TABS.map((tab) => (
                <Tabs.Tab key={tab}>{GO_LIVE_TAB_LABELS[tab]}</Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.Root>
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
              <OnAirBadge label={t('goLive.rotation')} />
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

          <GoLiveTabContent tab={activeTab} state={state} />

          <Dialog.Root
            isOpen={showInfoModalOpen}
            onClose={() => setShowInfoModalOpen(false)}
            className="max-w-lg"
          >
            <Dialog.Title>{t('goLive.showInfo')}</Dialog.Title>
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
            title={t('studioGoLive.confirmTitle')}
            description={t('studioGoLive.confirmDescription')}
            confirmLabel={t('studioGoLive.confirmLabel')}
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
