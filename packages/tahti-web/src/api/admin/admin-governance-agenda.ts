import { getJson, sendJson } from '../http';
import { isForceMock } from '../mode';

/** One item on a meeting's agenda, in agenda order (`position`). */
export type GovernanceAgendaItem = {
  id: string;
  meetingId: string;
  position: number;
  title: string;
  description: string | null;
  outcome: string | null;
};

export type AgendaResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };

const mockAgenda = new Map<string, GovernanceAgendaItem[]>([
  [
    'meeting-mock-1',
    [
      {
        id: 'agenda-1',
        meetingId: 'meeting-mock-1',
        position: 1,
        title: 'Opening of the meeting',
        description: null,
        outcome: null,
      },
      {
        id: 'agenda-2',
        meetingId: 'meeting-mock-1',
        position: 2,
        title: 'Annual report 2025',
        description: 'The board presents the yearly report for approval.',
        outcome: null,
      },
    ],
  ],
]);

export function mockAgendaItems(meetingId: string): GovernanceAgendaItem[] {
  return mockAgenda.get(meetingId) ?? [];
}

export function setMockAgendaItems(
  meetingId: string,
  items: GovernanceAgendaItem[],
): void {
  mockAgenda.set(
    meetingId,
    items.map((item, index) => ({ ...item, position: index + 1 })),
  );
}

export function errorText(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export async function fetchAdminAgendaItems(
  meetingId: string,
): Promise<AgendaResult<GovernanceAgendaItem[]>> {
  if (isForceMock()) {
    return { ok: true, data: [...mockAgendaItems(meetingId)] };
  }
  try {
    const data = await getJson<GovernanceAgendaItem[]>(
      `/api/admin/governance/meetings/${encodeURIComponent(meetingId)}/agenda-items`,
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: errorText(err, 'Could not load the agenda') };
  }
}

/** Adds an item at the end of the agenda. */
export async function createAdminAgendaItem(
  meetingId: string,
  input: { title: string; description?: string },
): Promise<AgendaResult> {
  const title = input.title.trim();
  const description = input.description?.trim() || undefined;
  if (!title) {
    return { ok: false, error: 'Give the item a title' };
  }
  if (isForceMock()) {
    const items = mockAgendaItems(meetingId);
    setMockAgendaItems(meetingId, [
      ...items,
      {
        id: `agenda-${Date.now()}`,
        meetingId,
        position: items.length + 1,
        title,
        description: description ?? null,
        outcome: null,
      },
    ]);
    return { ok: true };
  }
  try {
    await sendJson(
      `/api/admin/governance/meetings/${encodeURIComponent(meetingId)}/agenda-items`,
      'POST',
      { title, ...(description ? { description } : {}) },
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorText(err, 'Could not add the item') };
  }
}

export type AgendaItemChange = {
  title?: string;
  description?: string | null;
  outcome?: string | null;
};

/** Edits an item; null clears the description or the outcome. */
export async function updateAdminAgendaItem(
  item: Pick<GovernanceAgendaItem, 'id' | 'meetingId'>,
  change: AgendaItemChange,
): Promise<AgendaResult> {
  if (change.title !== undefined && !change.title.trim()) {
    return { ok: false, error: 'Give the item a title' };
  }
  if (isForceMock()) {
    setMockAgendaItems(
      item.meetingId,
      mockAgendaItems(item.meetingId).map((current) =>
        current.id === item.id ? { ...current, ...change } : current,
      ),
    );
    return { ok: true };
  }
  try {
    await sendJson(
      `/api/admin/governance/agenda-items/${encodeURIComponent(item.id)}`,
      'PATCH',
      change,
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorText(err, 'Could not save the item') };
  }
}
