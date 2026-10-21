import { RotateCcwIcon } from 'lucide-react';

import { Button, Input, Tooltip } from '@tahti-player/ui';

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
  const color = profile.nameplateColor ?? '';
  return (
    <div className="flex flex-col gap-3">
      <Input
        label="Nameplate"
        description="A short label shown as a coloured pill next to your name on your artist page."
        placeholder="e.g. Resident DJ"
        maxLength={NAMEPLATE_MAX_LENGTH}
        value={profile.nameplateText ?? ''}
        onChange={(e) =>
          setProfile({ ...profile, nameplateText: e.target.value })
        }
      />
      <label className="border-border bg-background-secondary/40 flex items-center gap-3 rounded-lg border p-2.5 text-sm">
        <Input
          type="color"
          value={color || '#22d3ee'}
          onChange={(e) =>
            setProfile({ ...profile, nameplateColor: e.target.value })
          }
          aria-label="Nameplate color"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Nameplate color</span>
          <span className="text-foreground-secondary block text-xs">
            {color || 'Default (your page accent)'}
          </span>
        </span>
        <Nameplate text={profile.nameplateText} color={color || null} />
        {color ? (
          <Tooltip content="Use the page accent" side="top">
            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              aria-label="Use the page accent"
              onClick={() => setProfile({ ...profile, nameplateColor: null })}
            >
              <RotateCcwIcon size={14} aria-hidden />
            </Button>
          </Tooltip>
        ) : null}
      </label>
      <SettingsToggle
        label="Show page hero"
        description="The header card with your avatar, name and stats on your channel page."
        value={profile.showPageHero ?? true}
        onChange={(showPageHero) => setProfile({ ...profile, showPageHero })}
      />
    </div>
  );
}
