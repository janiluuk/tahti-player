import { sendJson } from '../http';
import { isForceMock } from '../mode';
import type { GovernanceDocument } from '../types';

export type DocumentChange = {
  archived?: boolean;
  title?: string;
};

/** Archive/restore a document or rename it (PATCH …/documents/:id). The type,
 * version and file stay: a changed file is a new version. Refused while the
 * document is under a legal hold. */
export async function patchAdminGovernanceDocument(
  document: GovernanceDocument,
  change: DocumentChange,
): Promise<
  { ok: true; data: GovernanceDocument } | { ok: false; error: string }
> {
  if (change.title !== undefined && !change.title.trim()) {
    return { ok: false, error: 'Give the document a title' };
  }
  const body = {
    ...change,
    ...(change.title !== undefined ? { title: change.title.trim() } : {}),
  };
  if (isForceMock()) {
    if (document.legalHoldAt) {
      return {
        ok: false,
        error: 'The document is under a legal hold and cannot be changed',
      };
    }
    const { archived, ...rest } = body;
    return {
      ok: true,
      data: {
        ...document,
        ...rest,
        ...(archived !== undefined
          ? { archivedAt: archived ? new Date().toISOString() : null }
          : {}),
      },
    };
  }
  try {
    const data = await sendJson<GovernanceDocument>(
      `/api/admin/governance/documents/${encodeURIComponent(document.id)}`,
      'PATCH',
      body,
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not save the document',
    };
  }
}
