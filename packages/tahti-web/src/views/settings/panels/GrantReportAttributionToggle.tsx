import { useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';

import { patchMeProfile, type ProfileFields } from '../../../api/studio-extras';
import { SettingsToggle } from '../SettingsFields';

export const GRANT_REPORT_ATTRIBUTION_LABEL =
  'Show my name in the annual grant report';

export function GrantReportAttributionToggle({
  profile,
  onSaved,
}: {
  profile: ProfileFields;
  onSaved: (profile: ProfileFields) => void;
}) {
  const { t } = useTranslation('web');
  const [value, setValue] = useState(profile.publicAttribution);

  if (typeof value !== 'boolean') {
    return null;
  }

  return (
    <SettingsToggle
      label={GRANT_REPORT_ATTRIBUTION_LABEL}
      description={t(
        'grantReportAttributionToggleText.tahtiPublishesWhoReceivedArtist',
      )}
      value={value}
      onChange={(next) => {
        const previous = value;
        setValue(next);
        void patchMeProfile({ publicAttribution: next }).then((result) => {
          if (!result.ok) {
            setValue(previous);
            toast.error(result.error);
            return;
          }
          setValue(result.data.publicAttribution ?? next);
          onSaved(result.data);
          toast.success(i18n.t('web:toasts.visibilitySettingSaved'));
        });
      }}
    />
  );
}
