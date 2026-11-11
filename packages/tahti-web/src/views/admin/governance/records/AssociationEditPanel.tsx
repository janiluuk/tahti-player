import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, InlineError, Input } from '@tahti-player/ui';

import {
  BUSINESS_ID_PATTERN,
  patchAssociationProfile,
  type AssociationFields,
} from '../../../../api/admin/admin-governance-association';
import { fetchAssociationProfile } from '../../../../api/governance-association';
import { PageLoading } from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';

type Field = keyof AssociationFields;

function associationFields(t: (key: string) => string): Array<{
  key: Field;
  label: string;
  maxLength: number;
}> {
  return [
    {
      key: 'name',
      label: t('associationEditPanelLeftovers.name'),
      maxLength: 200,
    },
    {
      key: 'businessId',
      label: t('associationEditPanelLeftovers.businessId'),
      maxLength: 9,
    },
    {
      key: 'registerNumber',
      label: t('associationEditPanelLeftovers.registerNumber'),
      maxLength: 40,
    },
    {
      key: 'domicile',
      label: t('associationEditPanelLeftovers.domicile'),
      maxLength: 100,
    },
    {
      key: 'contactEmail',
      label: t('associationEditPanelLeftovers.contactEmail'),
      maxLength: 200,
    },
    {
      key: 'postalAddress',
      label: t('associationEditPanelLeftovers.postalAddress'),
      maxLength: 500,
    },
    {
      key: 'website',
      label: t('associationEditPanelLeftovers.website'),
      maxLength: 500,
    },
  ];
}

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
  const { t } = useTranslation('web');
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
              associationFields(t).map(({ key }) => [key, profile[key] ?? '']),
            ) as Record<Field, string>)
          : EMPTY,
      );
    });
  }, []);

  if (!values) {
    return (
      <StudioPanel title={t('associationEditPanel.theAssociation')}>
        <PageLoading label={t('loading.loadingTheAssociationSDetails')} />
      </StudioPanel>
    );
  }

  return (
    <StudioPanel title={t('associationEditPanel.theAssociation')}>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const businessId = values.businessId.trim();
          if (businessId && !BUSINESS_ID_PATTERN.test(businessId)) {
            setError(t('associationEditPanelLeftovers.businessIdFormat'));
            return;
          }
          const fields = Object.fromEntries(
            associationFields(t).map(({ key }) => [
              key,
              values[key].trim() || null,
            ]),
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
        {associationFields(t).map((field) => (
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
          {error ? <InlineError>{error}</InlineError> : null}
          {saved ? (
            <p role="status" className="text-sm">
              {t('associationEditPanel.savedMembersSeeTheseDetails')}
            </p>
          ) : null}
          <Button type="submit" size="sm" className="w-fit" disabled={busy}>
            {t('associationEditPanel.saveDetails')}
          </Button>
        </div>
      </form>
    </StudioPanel>
  );
}
