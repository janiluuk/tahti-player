import type { TFunction } from '@tahti-player/i18n';

export function groupPersonName(person: {
  username: string;
  displayName: string;
}): string {
  const name = person.displayName.trim();
  if (!name || name.includes('@')) {
    return person.username;
  }
  return name;
}

export function groupMembersLabel(count: number, t: TFunction<'web'>): string {
  return t('studioGroups.members', { count });
}

export function groupSoundsLabel(count: number, t: TFunction<'web'>): string {
  return t('studioGroups.sounds', { count });
}

export function joinPolicyOptions(t: TFunction<'web'>) {
  return [
    { id: 'OPEN' as const, label: t('studioGroups.joinOpen') },
    { id: 'REQUEST' as const, label: t('studioGroups.joinRequest') },
  ];
}

export function submitPolicyOptions(t: TFunction<'web'>) {
  return [
    { id: 'OPEN' as const, label: t('studioGroups.submitOpen') },
    { id: 'APPROVE' as const, label: t('studioGroups.submitApprove') },
  ];
}
