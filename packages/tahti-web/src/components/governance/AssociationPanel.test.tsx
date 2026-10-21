import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as association from '../../api/governance-association';
import { AssociationPanel } from './AssociationPanel';

describe('AssociationPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the registered details and serving auditors', async () => {
    vi.spyOn(association, 'fetchAssociationProfile').mockResolvedValue({
      data: association.mockAssociationProfile(),
      meta: { source: 'api' },
    });
    render(<AssociationPanel />);
    expect(await screen.findByText('1234567-8')).toBeInTheDocument();
    expect(screen.getByText('Business ID')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'hallitus@tahti.live' }),
    ).toHaveAttribute('href', 'mailto:hallitus@tahti.live');
    expect(screen.getByText('Anna Virtanen')).toBeInTheDocument();
    expect(screen.getByText('Operations inspector')).toBeInTheDocument();
    expect(screen.getByText('Deputy operations inspector')).toBeInTheDocument();
  });

  it('says when the board has entered nothing', async () => {
    vi.spyOn(association, 'fetchAssociationProfile').mockResolvedValue({
      data: {
        name: null,
        businessId: null,
        registerNumber: null,
        domicile: null,
        contactEmail: null,
        postalAddress: null,
        website: null,
        updatedAt: null,
        auditors: [],
      },
      meta: { source: 'api' },
    });
    render(<AssociationPanel />);
    expect(
      await screen.findByText(
        "The board has not entered the association's details yet.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No auditor or operations inspector is serving.'),
    ).toBeInTheDocument();
  });

  it('says when the details could not be loaded, and retries', async () => {
    const fetch = vi
      .spyOn(association, 'fetchAssociationProfile')
      .mockResolvedValue({
        data: null,
        meta: { source: 'api', reason: 'Members only' },
      });
    render(<AssociationPanel />);
    expect(
      await screen.findByText("Could not load the association's details"),
    ).toBeInTheDocument();
    fetch.mockResolvedValue({
      data: association.mockAssociationProfile(),
      meta: { source: 'api' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('1234567-8')).toBeInTheDocument();
  });
});
