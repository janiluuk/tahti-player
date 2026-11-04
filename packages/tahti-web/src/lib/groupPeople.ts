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

export function groupCountLabel(
  count: number,
  singular: string,
  plural: string,
): string {
  return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}

export const JOIN_POLICY_OPTIONS = [
  { id: 'OPEN', label: 'Anyone can join' },
  { id: 'REQUEST', label: 'Request to join' },
];

export const SUBMIT_POLICY_OPTIONS = [
  { id: 'OPEN', label: 'Members add right away' },
  { id: 'APPROVE', label: 'Admins approve first' },
];
