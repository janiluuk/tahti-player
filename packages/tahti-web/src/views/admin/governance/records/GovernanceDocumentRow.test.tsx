import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as documents from '../../../../api/admin/admin-governance-documents';
import type { GovernanceDocument } from '../../../../api/types';
import { GovernanceDocumentRow } from './GovernanceDocumentRow';

const document: GovernanceDocument = {
  id: 'd1',
  title: 'Rules',
  type: 'BYLAWS',
  description: null,
  version: 2,
  effectiveAt: null,
  publishedAt: '2026-01-01T00:00:00.000Z',
  meetingId: null,
  downloadUrl: 'https://files.example/rules.pdf',
  externalUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('GovernanceDocumentRow', () => {
  it('links the document and offers a legal hold', () => {
    render(
      <ul>
        <GovernanceDocumentRow document={document} />
      </ul>,
    );
    expect(
      screen.getByRole('link', { name: 'Rules (opens in a new tab)' }),
    ).toHaveAttribute('href', 'https://files.example/rules.pdf');
    expect(screen.getByText(/v2 · Published/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Legal hold: Rules v2' }),
    ).toBeInTheDocument();
  });

  it('shows a held document as held', () => {
    render(
      <ul>
        <GovernanceDocumentRow
          document={{
            ...document,
            legalHoldAt: '2026-05-01T00:00:00.000Z',
            legalHoldReason: 'Dispute over version 2',
          }}
        />
      </ul>,
    );
    expect(screen.getByText('On legal hold')).toBeInTheDocument();
    expect(screen.getByText('Dispute over version 2')).toBeInTheDocument();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('archives a document and hands back the saved one', async () => {
    const saved = { ...document, archivedAt: '2026-10-17T00:00:00.000Z' };
    const patch = vi
      .spyOn(documents, 'patchAdminGovernanceDocument')
      .mockResolvedValue({ ok: true, data: saved });
    const onChanged = vi.fn();
    render(
      <ul>
        <GovernanceDocumentRow document={document} onChanged={onChanged} />
      </ul>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Archive: Rules v2' }));
    expect(patch).toHaveBeenCalledWith(document, { archived: true });
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith(saved));
  });

  it('renames a document and shows a refusal for a held one', async () => {
    vi.spyOn(documents, 'patchAdminGovernanceDocument').mockResolvedValue({
      ok: false,
      error: 'The document is under a legal hold and cannot be changed',
    });
    render(
      <ul>
        <GovernanceDocumentRow document={document} />
      </ul>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Rename: Rules v2' }));
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Association rules' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save title' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'under a legal hold',
    );
  });

  it('marks and restores an archived document', () => {
    render(
      <ul>
        <GovernanceDocumentRow
          document={{ ...document, archivedAt: '2026-10-01T00:00:00.000Z' }}
        />
      </ul>,
    );
    expect(screen.getByText('Archived')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Restore: Rules v2' }),
    ).toBeInTheDocument();
  });
});
