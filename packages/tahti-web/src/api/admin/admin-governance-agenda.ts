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

/** Removes an item; the ones after it move up a place. Refused while records
 * point at it, once the minutes are approved, or while the meeting is held. */
export async function deleteAdminAgendaItem(
  item: Pick<GovernanceAgendaItem, 'id' | 'meetingId'>,
): Promise<AgendaResult> {
  if (isForceMock()) {
    setMockAgendaItems(
      item.meetingId,
      mockAgendaItems(item.meetingId).filter((c) => c.id !== item.id),
    );
    return { ok: true };
  }
  try {
    await sendJson(
      `/api/admin/governance/agenda-items/${encodeURIComponent(item.id)}`,
      'DELETE',
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorText(err, 'Could not remove the item') };
  }
}

/** Saves a new order: every item of the meeting, each once. */
export async function reorderAdminAgendaItems(
  meetingId: string,
  ids: string[],
): Promise<AgendaResult> {
  if (isForceMock()) {
    const byId = new Map(mockAgendaItems(meetingId).map((i) => [i.id, i]));
    setMockAgendaItems(
      meetingId,
      ids.flatMap((id) => {
        const item = byId.get(id);
        return item ? [item] : [];
      }),
    );
    return { ok: true };
  }
  try {
    await sendJson(
      `/api/admin/governance/meetings/${encodeURIComponent(meetingId)}/agenda-items/order`,
      'PUT',
      { ids },
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorText(err, 'Could not reorder the agenda') };
  }
}

/** The ids with the item at `index` moved one place up (-1) or down (+1). */
export function movedAgendaIds(
  items: GovernanceAgendaItem[],
  index: number,
  step: -1 | 1,
): string[] | null {
  const target = index + step;
  if (target < 0 || target >= items.length) {
    return null;
  }
  const ids = items.map((item) => item.id);
  [ids[index], ids[target]] = [ids[target]!, ids[index]!];
  return ids;
}
