import { CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Tooltip } from '@tahti-player/ui';

import { patchMeProfile } from '../../../api/studio-extras';
import {
  AVATAR_THEME_PRESETS,
  avatarThemeCss,
  sameAvatarTheme,
  type AvatarTheme,
} from '../../../lib/avatarTheme';
import { cn } from '../../../lib/cn';
import { webT } from '../../../lib/webT';

/** Swatches for the fill drawn in place of a missing profile picture. Each
 * pick saves straight away; "Default" clears it back to the generated art. */
export function AvatarThemePicker({
  value,
  onChange,
}: {
  value: AvatarTheme | null;
  onChange: (next: AvatarTheme | null) => void;
}) {
  const { t } = useTranslation('web');
  const [busy, setBusy] = useState(false);

  const save = async (next: AvatarTheme | null) => {
    if (sameAvatarTheme(next, value)) {
      return;
    }
    setBusy(true);
    const result = await patchMeProfile({ avatarTheme: next });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onChange(next);
  };

  return (
    <fieldset className="flex flex-col gap-2" data-testid="avatar-theme-picker">
      <legend className="text-sm font-semibold">
        {t('avatarThemePicker.avatarColour')}
      </legend>
      <p className="text-foreground-secondary text-xs">
        {t('avatarThemePicker.fillsYourAvatarWhileYou')}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {AVATAR_THEME_PRESETS.map((preset, index) => {
          const selected = sameAvatarTheme(preset, value);
          return (
            <Tooltip
              key={avatarThemeCss(preset)}
              content={webT()('templateText.avatarColour', { name: index + 1 })}
              side="top"
            >
              <Button
                type="button"
                size="icon-sm"
                variant="text"
                disabled={busy}
                aria-label={webT()('templateText.avatarColour', {
                  name: index + 1,
                })}
                aria-pressed={selected}
                className={cn(
                  'size-8 rounded-full p-0 text-white',
                  selected && 'ring-foreground ring-2 ring-offset-2',
                )}
                style={{ background: avatarThemeCss(preset) }}
                onClick={() => void save(preset)}
              >
                {selected ? <CheckIcon size={14} aria-hidden /> : null}
              </Button>
            </Tooltip>
          );
        })}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          aria-pressed={value === null}
          onClick={() => void save(null)}
        >
          {t('avatarThemePicker.default')}
        </Button>
      </div>
    </fieldset>
  );
}
