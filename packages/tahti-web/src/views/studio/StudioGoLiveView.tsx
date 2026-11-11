import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  Skeleton,
  Stepper,
  ViewShell,
  type StepperStep,
} from '@tahti-player/ui';

import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageErrorBanner } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { BroadcastCredentialsPanel } from './go-live/BroadcastCredentialsPanel';
import { GoLiveHeader } from './go-live/GoLiveHeader';
import { goLiveStatus } from './go-live/GoLiveStatusChip';
import {
  defaultGoLiveStep,
  GO_LIVE_STEPS,
  goLiveStepFromSearch,
  goLiveStepStatus,
  missingRequiredSteps,
  nextGoLiveStep,
  type GoLiveProgress,
  type GoLiveStepId,
} from './go-live/goLiveSteps';
import { GreenRoomSessionPanel } from './go-live/GreenRoomSessionPanel';
import { MultistreamPanel } from './go-live/MultistreamPanel';
import { RecordingPanel } from './go-live/RecordingPanel';
import { ShowInfoCard } from './go-live/ShowInfoCard';
import { SignalPanel } from './go-live/SignalPanel';
import { useGoLiveState, type GoLiveState } from './go-live/useGoLiveState';

function readSearch(raw: unknown): { step?: string; tab?: string } {
  if (typeof raw === 'string') {
    const params = new URLSearchParams(raw);
    return {
      step: params.get('step') ?? undefined,
      tab: params.get('tab') ?? undefined,
    };
  }
  if (raw && typeof raw === 'object') {
    const { step, tab } = raw as { step?: unknown; tab?: unknown };
    return {
      step: typeof step === 'string' ? step : undefined,
      tab: typeof tab === 'string' ? tab : undefined,
    };
  }
  return {};
}

function NextStepFooter({
  step,
  onNext,
}: {
  step: GoLiveStepId;
  onNext: (step: GoLiveStepId) => void;
}) {
  const { t } = useTranslation('web');
  const next = nextGoLiveStep(step);
  if (!next) {
    return (
      <p
        className="border-border-subtle text-foreground-secondary mt-4 rounded-lg border px-4 py-3 text-sm"
        data-testid="go-live-final-guidance"
      >
        {t('goLivePage.next.finalGuidance')}
      </p>
    );
  }
  return (
    <div className="mt-4 flex justify-end">
      <Button
        variant="plain"
        size="flexible"
        className="bg-foreground text-background focus-visible:outline-focus-ring min-h-11 rounded-md px-4 font-semibold focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2"
        onClick={() => onNext(next)}
      >
        {t('goLivePage.next.label', {
          step: t(`goLivePage.steps.${next}`),
        })}
      </Button>
    </div>
  );
}

function StepPanel({
  step,
  state,
  onNext,
}: {
  step: GoLiveStepId;
  state: GoLiveState;
  onNext: (step: GoLiveStepId) => void;
}) {
  const { t } = useTranslation('web');
  const footer = <NextStepFooter step={step} onNext={onNext} />;

  if (step === 'show-info') {
    if (!state.preflight) {
      return (
        <div className="flex flex-col gap-4">
          <PageErrorBanner
            title={t('loadErrors.couldNotLoadYourShowDetails')}
            description={state.preflightError ?? undefined}
            onRetry={() => void state.reload()}
          />
          {footer}
        </div>
      );
    }
    return (
      <ShowInfoCard
        preflight={state.preflight}
        isLive={state.channelState === 'LIVE'}
        onSaved={state.setPreflight}
        footer={footer}
      />
    );
  }
  let panel;
  if (step === 'credentials') {
    panel = <BroadcastCredentialsPanel state={state} />;
  } else if (step === 'encoder') {
    panel = <SignalPanel state={state} />;
  } else if (step === 'recording') {
    panel = <RecordingPanel state={state} />;
  } else if (step === 'destinations') {
    panel = (
      <MultistreamPanel
        targets={state.targets}
        reload={state.reload}
        loadError={state.targetsError}
      />
    );
  } else {
    panel = <GreenRoomSessionPanel />;
  }
  return (
    <div className="flex flex-col">
      {panel}
      {footer}
    </div>
  );
}

function GoLiveSkeleton() {
  const { t } = useTranslation('web');
  return (
    <div
      aria-busy="true"
      aria-label={t('goLivePage.loading')}
      role="region"
      data-testid="go-live-loading"
      className="grid w-full gap-6 md:grid-cols-[16rem_minmax(0,1fr)]"
    >
      <div className="flex flex-col gap-2">
        {GO_LIVE_STEPS.map((step) => (
          <Skeleton key={step} className="h-11 w-full" />
        ))}
      </div>
      <div className="border-border-subtle flex flex-col gap-4 rounded-xl border p-4 sm:p-6">
        <Skeleton shape="line" className="h-5 w-40" />
        <Skeleton shape="line" lines={2} />
        <div className="flex flex-wrap gap-4">
          <Skeleton className="size-33" />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudioGoLiveView() {
  const { t } = useTranslation('web');
  const state = useGoLiveState();
  const navigate = useNavigate();
  const search = useRouterState({
    select: (s) => readSearch(s.location.search),
    structuralSharing: true,
  });
  const [helpOpen, setHelpOpen] = useState(false);
  const [openingStep, setOpeningStep] = useState<GoLiveStepId | null>(null);

  const {
    message,
    slug,
    isBroadcastLive,
    reconnecting,
    preflight,
    settings,
    settingsError,
    signalOk,
    usage,
    busy,
    loaded,
    confirmGoLive,
    setConfirmGoLive,
    confirmEnd,
    setConfirmEnd,
    onGoLive,
    onEndBroadcast,
  } = state;

  const progress: GoLiveProgress = {
    showNameSaved: Boolean(preflight?.title?.trim()),
    settingsLoaded: Boolean(settings),
    settingsFailed: loaded && !settings && Boolean(settingsError),
    signalOk: signalOk || isBroadcastLive,
    reconnecting,
  };
  const missing = missingRequiredSteps(progress);
  const requested = goLiveStepFromSearch(search);
  const selected = requested ?? openingStep ?? 'show-info';
  const onAir = isBroadcastLive || reconnecting;
  const status = goLiveStatus({
    isBroadcastLive,
    reconnecting,
    requiredDone: missing.length === 0,
  });

  // Picked once on load: finishing a step must not move the artist away
  // from the panel they are on.
  const firstOpenStep = defaultGoLiveStep(progress);
  useEffect(() => {
    if (loaded && !openingStep) {
      setOpeningStep(firstOpenStep);
    }
  }, [loaded, openingStep, firstOpenStep]);

  useEffect(() => {
    if (search.tab && !search.step && requested) {
      void navigate({
        to: '/studio/go-live',
        search: { step: requested },
        replace: true,
      });
    }
  }, [navigate, requested, search.step, search.tab]);

  const selectStep = (step: GoLiveStepId) => {
    void navigate({ to: '/studio/go-live', search: { step } });
  };

  const captionFor = (step: GoLiveStepId): string | undefined => {
    switch (step) {
      case 'show-info':
        return preflight?.title?.trim() || t('goLivePage.caption.required');
      case 'credentials':
        return progress.settingsFailed
          ? t('goLivePage.caption.couldNotLoad')
          : undefined;
      case 'encoder':
        if (reconnecting) {
          return t('goLivePage.caption.reconnecting');
        }
        return progress.signalOk
          ? t('goLivePage.caption.connected')
          : t('goLivePage.caption.required');
      case 'recording':
        return state.recordEnabled
          ? t('goLivePage.caption.recordingOn')
          : t('goLivePage.caption.recordingOff');
      case 'destinations':
        return state.targets.length > 0
          ? t('goLivePage.caption.destinations', {
              count: state.targets.length,
            })
          : t('goLivePage.caption.optional');
      default:
        return t('goLivePage.caption.optional');
    }
  };

  const steps: StepperStep[] = GO_LIVE_STEPS.map((step) => {
    const stepStatus = goLiveStepStatus(step, selected, progress);
    const done =
      stepStatus === 'current' &&
      ((step === 'show-info' && progress.showNameSaved) ||
        (step === 'credentials' && progress.settingsLoaded) ||
        (step === 'encoder' && progress.signalOk));
    const caption = captionFor(step);
    return {
      id: step,
      title: t(`goLivePage.steps.${step}`),
      status: stepStatus,
      caption:
        done && caption === undefined ? t('goLivePage.stepper.done') : caption,
    };
  });

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex w-full max-w-6xl flex-col gap-6">
        <ViewShell classes={{ root: 'px-0 pt-0' }}>
          <div className="flex w-full flex-col gap-6">
            <GoLiveHeader
              status={status}
              liveSince={state.liveSince}
              reconnectDeadline={state.reconnectDeadline}
              missing={missing}
              usageBlocked={Boolean(usage?.blocked)}
              onAir={onAir}
              busy={busy}
              slug={slug}
              onStart={() => setConfirmGoLive(true)}
              onEnd={() => setConfirmEnd(true)}
              onHelp={() => setHelpOpen(true)}
            />

            {message && (
              <p
                className={
                  message.tone === 'error'
                    ? 'border-accent-red text-foreground rounded-lg border px-3 py-2 text-sm'
                    : 'border-border-subtle bg-background-secondary text-foreground rounded-lg border px-3 py-2 text-sm'
                }
                role={message.tone === 'error' ? 'alert' : 'status'}
              >
                {message.text}
              </p>
            )}

            {!loaded ? (
              <GoLiveSkeleton />
            ) : (
              <div className="grid w-full gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
                <Stepper
                  steps={steps}
                  aria-label={t('goLivePage.stepper.label')}
                  statusLabels={{
                    complete: t('goLivePage.stepper.done'),
                    current: t('goLivePage.stepper.current'),
                    upcoming: t('goLivePage.stepper.upcoming'),
                    error: t('goLivePage.stepper.error'),
                  }}
                  collapse="mobile"
                  collapsedLabel={(position, total, title) =>
                    t('goLivePage.stepper.collapsed', {
                      position,
                      total,
                      title,
                    })
                  }
                  onSelect={(id) => selectStep(id as GoLiveStepId)}
                  className="md:sticky md:top-4 md:self-start"
                />
                <div
                  className="min-w-0"
                  data-testid={`go-live-step-${selected}`}
                >
                  <StepPanel
                    step={selected}
                    state={state}
                    onNext={selectStep}
                  />
                </div>
              </div>
            )}
          </div>

          <Dialog.Root
            isOpen={helpOpen}
            onClose={() => setHelpOpen(false)}
            className="max-w-lg"
          >
            <Dialog.Title>{t('goLive.howBroadcastingWorksHere')}</Dialog.Title>
            <div className="text-foreground-secondary mt-3 flex flex-col gap-3 text-sm leading-relaxed">
              <p>{t('goLivePage.help.connect')}</p>
              <p>{t('goLivePage.help.obs')}</p>
              <p>{t('goLivePage.help.multistream')}</p>
            </div>
            <div className="mt-5 flex justify-end">
              <Button
                variant="tertiary"
                className="min-h-11"
                onClick={() => setHelpOpen(false)}
              >
                {t('actions.close')}
              </Button>
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
          <ConfirmDialog
            isOpen={confirmEnd}
            title={t('goLivePage.end.confirmTitle')}
            description={t('goLivePage.end.confirmDescription')}
            confirmLabel={t('goLivePage.end.confirmLabel')}
            destructive
            onCancel={() => setConfirmEnd(false)}
            onConfirm={() => {
              setConfirmEnd(false);
              void onEndBroadcast();
            }}
          />
        </ViewShell>
      </div>
    </StudioGate>
  );
}
