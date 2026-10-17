import type { AssociationProfile } from '../governance-association';
import { mockAssociationProfile } from '../governance-association';
import { sendJson } from '../http';
import { isForceMock } from '../mode';

export type AssociationFields = Pick<
  AssociationProfile,
  | 'name'
  | 'businessId'
  | 'registerNumber'
  | 'domicile'
  | 'contactEmail'
  | 'postalAddress'
  | 'website'
>;

export const BUSINESS_ID_PATTERN = /^\d{7}-\d$/;

/** Saves the association's registered details; null clears a field
 * (PATCH /api/admin/governance/association). */
export async function patchAssociationProfile(
  fields: Partial<AssociationFields>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (fields.businessId && !BUSINESS_ID_PATTERN.test(fields.businessId)) {
    return { ok: false, error: 'Business ID must look like 1234567-8' };
  }
  if (isForceMock()) {
    Object.assign(mockAssociationProfile(), fields);
    return { ok: true };
  }
  try {
    await sendJson('/api/admin/governance/association', 'PATCH', fields);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not save the details',
    };
  }
}
