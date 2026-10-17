import { useEffect, useState } from 'react';

import { Button, Input } from '@tahti-player/ui';

import {
  BUSINESS_ID_PATTERN,
  patchAssociationProfile,
  type AssociationFields,
} from '../../../../api/admin/admin-governance-association';
import { fetchAssociationProfile } from '../../../../api/governance-association';
import { PageLoading } from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';

type Field = keyof AssociationFields;

const FIELDS: Array<{
  key: Field;
  label: string;
  maxLength: number;
}> = [
  { key: 'name', label: 'Name', maxLength: 200 },
  { key: 'businessId', label: 'Business ID', maxLength: 9 },
  { key: 'registerNumber', label: 'Register number', maxLength: 40 },
  { key: 'domicile', label: 'Domicile', maxLength: 100 },
  { key: 'contactEmail', label: 'Contact email', maxLength: 200 },
  { key: 'postalAddress', label: 'Postal address', maxLength: 500 },
  { key: 'website', label: 'Website', maxLength: 500 },
];

const EMPTY: Record<Field, string> = {
  name: '',
  businessId: '',
  registerNumber: '',
  domicile: '',
  contactEmail: '',
  postalAddress: '',
  website: '',
};

/** The association's registered identity and contacts, which members see on
 * Governance. An empty field is cleared. */
export function AssociationEditPanel() {
  const [values, setValues] = useState<Record<Field, string> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void fetchAssociationProfile().then((result) => {
      const profile = result.data;
      setValues(
        profile
          ? (Object.fromEntries(
              FIELDS.map(({ key }) => [key, profile[key] ?? '']),
            ) as Record<Field, string>)
          : EMPTY,
      );
    });
  }, []);

  if (!values) {
    return (
      <StudioPanel title="The association">
        <PageLoading label="Loading the association's details…" />
      </StudioPanel>
    );
  }

  return (
    <StudioPanel title="The association">
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const businessId = values.businessId.trim();
          if (businessId && !BUSINESS_ID_PATTERN.test(businessId)) {
            setError('Business ID must look like 1234567-8.');
            return;
          }
          const fields = Object.fromEntries(
            FIELDS.map(({ key }) => [key, values[key].trim() || null]),
          ) as AssociationFields;
          setBusy(true);
          setError(null);
          setSaved(false);
          void patchAssociationProfile(fields).then((result) => {
            setBusy(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setSaved(true);
          });
        }}
      >
        {FIELDS.map((field) => (
          <Input
            key={field.key}
            label={field.label}
            value={values[field.key]}
            maxLength={field.maxLength}
            onChange={(e) =>
              setValues({ ...values, [field.key]: e.target.value })
            }
          />
        ))}
        <div className="flex flex-col gap-2 sm:col-span-2">
          {error ? (
            <p role="alert" className="text-accent-red-strong text-sm">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p role="status" className="text-sm">
              Saved. Members see these details on Governance.
            </p>
          ) : null}
          <Button type="submit" size="sm" className="w-fit" disabled={busy}>
            Save details
          </Button>
        </div>
      </form>
    </StudioPanel>
  );
}
