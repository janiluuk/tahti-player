import { RotateCcwIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, ColorField, Input, Tooltip } from '@tahti-player/ui';

import type { ProfileFields } from '../../api/studio-extras';
import { Nameplate } from '../../components/Nameplate';
import { SettingsToggle } from './SettingsFields';

export const NAMEPLATE_MAX_LENGTH = 40;

/** The PATCH /api/me/profile fields this section owns; blank values are
 * sent as null so the API clears them rather than storing an empty pill. */
export function nameplatePatch(profile: ProfileFields) {
  return {
    nameplateText: profile.nameplateText?.trim() || null,
    nameplateColor: profile.nameplateColor || null,
    showPageHero: profile.showPageHero ?? true,
  };
}

export function NameplateFields({
  profile,
  setProfile,
}: {
  profile: ProfileFields;
  setProfile: (profile: ProfileFields) => void;
}) {
  const { t } = useTranslation('web');
  const color = profile.nameplateColor ?? '';
  return (
    <div className="flex flex-col gap-3">
      <Input
        label={t('nameplate.nameplate')}
        description={t('nameplate.aShortLabelShownAs')}
        placeholder="e.g. Resident DJ"
        maxLength={NAMEPLATE_MAX_LENGTH}
        value={profile.nameplateText ?? ''}
        onChange={(e) =>
          setProfile({ ...profile, nameplateText: e.target.value })
        }
      />
      <ColorField
        label={t('nameplate.nameplateColor')}
        value={color || '#22d3ee'}
        detail={color || 'Default (your page accent)'}
        onChange={(next) => setProfile({ ...profile, nameplateColor: next })}
        actions={
          <>
            <Nameplate text={profile.nameplateText} color={color || null} />
            {color ? (
              <Tooltip content={t('nameplate.useThePageAccent')} side="top">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="secondary"
                  aria-label={t('nameplate.useThePageAccent')}
                  onClick={() =>
                    setProfile({ ...profile, nameplateColor: null })
                  }
                >
                  <RotateCcwIcon size={14} aria-hidden />
                </Button>
              </Tooltip>
            ) : null}
          </>
        }
      />
      <SettingsToggle
        label={t('nameplate.showPageHero')}
        description={t('nameplate.theHeaderCardWithYour')}
        value={profile.showPageHero ?? true}
        onChange={(showPageHero) => setProfile({ ...profile, showPageHero })}
      />
    </div>
  );
}
