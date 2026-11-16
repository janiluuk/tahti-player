import type { TFunction } from '@tahti-player/i18n';

const MEETING_TYPE_KEYS = {
  GENERAL: 'governanceLabels.typeGeneral',
  EXTRAORDINARY_GENERAL: 'governanceLabels.typeExtraordinary',
  BOARD: 'governanceLabels.typeBoard',
} as const;

const MEETING_STATE_KEYS = {
  DRAFT: 'governanceLabels.stateDraft',
  SCHEDULED: 'governanceLabels.stateScheduled',
  HELD: 'governanceLabels.stateHeld',
  MINUTES_DRAFT: 'governanceLabels.stateMinutesDraft',
  APPROVED: 'governanceLabels.stateApproved',
  CANCELLED: 'governanceLabels.stateCancelled',
} as const;

const VOTE_CHOICE_KEYS = {
  YES: 'governanceLabels.voteYes',
  NO: 'governanceLabels.voteNo',
  ABSTAIN: 'governanceLabels.voteAbstain',
} as const;

const MOTION_STATE_KEYS = {
  DRAFT: 'governanceLabels.motionStateDraft',
  OPEN: 'governanceLabels.motionStateOpen',
  CLOSED: 'governanceLabels.motionStateClosed',
  CANCELLED: 'governanceLabels.motionStateCancelled',
} as const;

const ATTENDANCE_STATUS_KEYS = {
  PRESENT: 'governanceLabels.attendancePresent',
  ABSENT: 'governanceLabels.attendanceAbsent',
  EXCUSED: 'governanceLabels.attendanceExcused',
} as const;

function sentenceCase(value: string): string {
  const words = value.replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function meetingTypeLabel(type: string, t: TFunction<'web'>): string {
  const key = MEETING_TYPE_KEYS[type as keyof typeof MEETING_TYPE_KEYS];
  return key ? t(key) : sentenceCase(type);
}

export function meetingStateLabel(state: string, t: TFunction<'web'>): string {
  const key = MEETING_STATE_KEYS[state as keyof typeof MEETING_STATE_KEYS];
  return key ? t(key) : sentenceCase(state);
}

export function voteChoiceLabel(choice: string, t: TFunction<'web'>): string {
  const key = VOTE_CHOICE_KEYS[choice as keyof typeof VOTE_CHOICE_KEYS];
  return key ? t(key) : sentenceCase(choice);
}

export function motionStateLabel(state: string, t: TFunction<'web'>): string {
  const key = MOTION_STATE_KEYS[state as keyof typeof MOTION_STATE_KEYS];
  return key ? t(key) : sentenceCase(state);
}

export function attendanceStatusLabel(
  status: string,
  t: TFunction<'web'>,
): string {
  const key =
    ATTENDANCE_STATUS_KEYS[status as keyof typeof ATTENDANCE_STATUS_KEYS];
  return key ? t(key) : sentenceCase(status);
}
