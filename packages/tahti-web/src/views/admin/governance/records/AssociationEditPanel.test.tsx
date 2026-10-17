import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as adminAssociation from '../../../../api/admin/admin-governance-association';
import * as association from '../../../../api/governance-association';
import { AssociationEditPanel } from './AssociationEditPanel';

describe('AssociationEditPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saves every field, clearing emptied ones', async () => {
    vi.spyOn(association, 'fetchAssociationProfile').mockResolvedValue({
      data: association.mockAssociationProfile(),
      meta: { source: 'api' },
    });
    const patch = vi
      .spyOn(adminAssociation, 'patchAssociationProfile')
      .mockResolvedValue({ ok: true });
    render(<AssociationEditPanel />);
    expect(await screen.findByLabelText('Business ID')).toHaveValue(
      '1234567-8',
    );
    fireEvent.change(screen.getByLabelText('Website'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));
    expect(patch).toHaveBeenCalledWith({
      name: 'Tahti ry',
      businessId: '1234567-8',
      registerNumber: '123.456',
      domicile: 'Helsinki',
      contactEmail: 'hallitus@tahti.live',
      postalAddress: 'PL 1, 00100 Helsinki',
      website: null,
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Saved.');
  });

  it('checks the business ID format first', async () => {
    vi.spyOn(association, 'fetchAssociationProfile').mockResolvedValue({
      data: null,
      meta: { source: 'api', reason: 'down' },
    });
    const patch = vi.spyOn(adminAssociation, 'patchAssociationProfile');
    render(<AssociationEditPanel />);
    fireEvent.change(await screen.findByLabelText('Business ID'), {
      target: { value: '12345678' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Business ID must look like 1234567-8.',
    );
    expect(patch).not.toHaveBeenCalled();
  });
});
