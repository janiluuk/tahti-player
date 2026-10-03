import { useState } from 'react';
import { toast } from 'sonner';

import { patchMeProfile, type ProfileFields } from '../../../api/studio-extras';
import { SettingsToggle } from '../SettingsFields';

export const GRANT_REPORT_ATTRIBUTION_LABEL =
  'Show my name in the annual grant report';

/** Hidden unless the profile carries the flag, so a failed profile load
 * (or an API without it) never shows a toggle in the wrong state. */
export function GrantReportAttributionToggle({
  profile,
  onSaved,
}: {
  profile: ProfileFields;
  onSaved: (profile: ProfileFields) => void;
}) {
  const [value, setValue] = useState(profile.publicAttribution);

  if (typeof value !== 'boolean') {
    return null;
  }

  return (
    <SettingsToggle
      label={GRANT_REPORT_ATTRIBUTION_LABEL}
      description="Tahti publishes who received artist grants each year. Turn this off to be listed by your member number instead of your name."
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
          toast.success('Visibility setting saved.');
        });
      }}
    />
  );
}
