import { useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Toggle } from '@tahti-player/ui';

import { patchStudioRelease } from '../../../api/studio';
import type { StudioRelease } from '../../../api/studio-types';
import { StudioPanel } from '../../../components/StudioPanel';

export function ReleasePoweredByFooterToggle({
  release,
  onChange,
}: {
  release: StudioRelease;
  onChange: (showPoweredByFooter: boolean) => void;
}) {
  const { t } = useTranslation('web');
  const [saving, setSaving] = useState(false);

  // An API that does not return the field would also drop it on PATCH, so a
  // toggle there would look saved without being stored.
  if (release.showPoweredByFooter === undefined) {
    return null;
  }

  const save = async (next: boolean) => {
    setSaving(true);
    try {
      const result = await patchStudioRelease(release.id, {
        showPoweredByFooter: next,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onChange(next);
      toast.success(
        next
          ? t('releasePoweredByFooterToggleStates.footerShownOnTheSmart')
          : t('releasePoweredByFooterToggleStates.footerHidden'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <StudioPanel>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Show "Powered by Tahti"</p>
          <p className="text-foreground-secondary mt-1 text-sm">
            {t('releasePoweredByFooterToggleText.addsASmallFooterLinking')}
          </p>
        </div>
        <Toggle
          label='Show "Powered by Tahti" footer'
          checked={release.showPoweredByFooter}
          disabled={saving}
          onChange={(next) => void save(next)}
        />
      </div>
    </StudioPanel>
  );
}
