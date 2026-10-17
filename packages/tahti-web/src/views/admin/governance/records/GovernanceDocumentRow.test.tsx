import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
    expect(screen.getByRole('link', { name: 'Rules' })).toHaveAttribute(
      'href',
      'https://files.example/rules.pdf',
    );
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
});
