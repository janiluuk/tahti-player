import type { StepStatus } from '@tahti-player/ui';

export const GO_LIVE_STEPS = [
  'show-info',
  'credentials',
  'encoder',
  'recording',
  'destinations',
  'green-room',
] as const;

export type GoLiveStepId = (typeof GO_LIVE_STEPS)[number];

export const REQUIRED_GO_LIVE_STEPS: readonly GoLiveStepId[] = [
  'show-info',
  'encoder',
];

/** The inner tabs the page had before the stepper, for old links. */
const LEGACY_TAB_STEPS: Record<string, GoLiveStepId> = {
  prep: 'show-info',
  credentials: 'credentials',
  recording: 'recording',
  destinations: 'destinations',
  'green-room': 'green-room',
};

export function isGoLiveStepId(value: unknown): value is GoLiveStepId {
  return (
    typeof value === 'string' &&
    (GO_LIVE_STEPS as readonly string[]).includes(value)
  );
}

export function goLiveStepFromLegacyTab(
  tab: string | undefined,
): GoLiveStepId | undefined {
  return tab ? LEGACY_TAB_STEPS[tab] : undefined;
}

/** `?step=` wins; otherwise an old `?tab=` maps to its step. */
export function goLiveStepFromSearch(search: {
  step?: string;
  tab?: string;
}): GoLiveStepId | undefined {
  if (isGoLiveStepId(search.step)) {
    return search.step;
  }
  return goLiveStepFromLegacyTab(search.tab);
}

export type GoLiveProgress = {
  showNameSaved: boolean;
  settingsLoaded: boolean;
  settingsFailed: boolean;
  signalOk: boolean;
  reconnecting: boolean;
};

export function completedGoLiveSteps(
  progress: GoLiveProgress,
): Set<GoLiveStepId> {
  const done = new Set<GoLiveStepId>();
  if (progress.showNameSaved) {
    done.add('show-info');
  }
  if (progress.settingsLoaded) {
    done.add('credentials');
  }
  if (progress.signalOk && !progress.reconnecting) {
    done.add('encoder');
  }
  return done;
}

export function missingRequiredSteps(progress: GoLiveProgress): GoLiveStepId[] {
  const done = completedGoLiveSteps(progress);
  return REQUIRED_GO_LIVE_STEPS.filter((step) => !done.has(step));
}

/** Without `?step=`, open the first required step still to do. */
export function defaultGoLiveStep(progress: GoLiveProgress): GoLiveStepId {
  return missingRequiredSteps(progress)[0] ?? 'show-info';
}

export function goLiveStepStatus(
  step: GoLiveStepId,
  selected: GoLiveStepId,
  progress: GoLiveProgress,
): StepStatus {
  if (step === 'encoder' && progress.reconnecting) {
    return 'error';
  }
  if (step === 'credentials' && progress.settingsFailed) {
    return 'error';
  }
  if (step === selected) {
    return 'current';
  }
  return completedGoLiveSteps(progress).has(step) ? 'complete' : 'upcoming';
}

export function nextGoLiveStep(step: GoLiveStepId): GoLiveStepId | null {
  const index = GO_LIVE_STEPS.indexOf(step);
  return GO_LIVE_STEPS[index + 1] ?? null;
}
