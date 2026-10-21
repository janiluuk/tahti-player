import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as certificates from '../../api/governance-motion-certificate';
import { MotionCertificatePanel } from './MotionCertificatePanel';

const base = certificates.mockMotionCertificate('m1', 'Adopt the rules');

describe('MotionCertificatePanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the fixed count and that it matches the record', async () => {
    vi.spyOn(certificates, 'fetchMotionCertificate').mockResolvedValue({
      data: base,
      meta: { source: 'api' },
    });
    render(<MotionCertificatePanel motionId="m1" />);
    expect(
      await screen.findByText('18 yes · 4 no · 2 abstain'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/24 votes of 42 eligible members/),
    ).toBeInTheDocument();
    expect(screen.getByText('Matches the record')).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`sha256 ${base.digest}`)),
    ).toBeInTheDocument();
  });

  it('flags a broken record and lists corrections', async () => {
    vi.spyOn(certificates, 'fetchMotionCertificate').mockResolvedValue({
      data: {
        ...base,
        matchesRecord: false,
        correctedTally: { YES: 17, NO: 4, ABSTAIN: 2 },
        corrections: [
          {
            id: 'c1',
            note: 'One vote was cast twice.',
            tally: { YES: 17, NO: 4, ABSTAIN: 2 },
            createdAt: '2026-10-02T00:00:00.000Z',
            digest: 'abc',
            matchesRecord: true,
          },
        ],
      },
      meta: { source: 'api' },
    });
    render(<MotionCertificatePanel motionId="m1" />);
    expect(
      await screen.findByText('Does not match the record'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Corrected count: 17 yes · 4 no · 2 abstain'),
    ).toBeInTheDocument();
    expect(screen.getByText('One vote was cast twice.')).toBeInTheDocument();
  });

  it('shows nothing when no certificate was issued', async () => {
    const fetchIt = vi
      .spyOn(certificates, 'fetchMotionCertificate')
      .mockResolvedValue({
        data: null,
        meta: { source: 'api', reason: 'No result certificate was issued' },
      });
    const { container } = render(<MotionCertificatePanel motionId="m1" />);
    await vi.waitFor(() => expect(fetchIt).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
