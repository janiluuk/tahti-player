import { PinIcon, PinOffIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Tooltip } from '@tahti-player/ui';

import { patchStudioRelease } from '../../api/studio';
import type { StudioRelease } from '../../api/studio-types';

/** Pins a release to the top of the artist's public profile, or unpins it. */
export function ReleasePinButton({
  release,
  onChange,
}: {
  release: StudioRelease;
  onChange: (pinnedAt: string | null) => void;
}) {
  const [saving, setSaving] = useState(false);
  const pinned = Boolean(release.pinnedAt);
  // Only published releases reach the public profile; unpin stays available so
  // a pin left on a draft or archived release can still be cleared.
  if (!pinned && release.state !== 'PUBLISHED') {
    return null;
  }
  const label = pinned ? 'Unpin from profile' : 'Pin to profile';

  const toggle = async () => {
    setSaving(true);
    const result = await patchStudioRelease(release.id, { pinned: !pinned });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onChange(result.data.pinnedAt ?? null);
    toast.success(
      pinned ? 'Unpinned from your profile.' : 'Pinned to your profile.',
    );
  };

  return (
    <Tooltip content={label} side="top">
      <Button
        size="icon-sm"
        variant="text"
        aria-label={label}
        aria-pressed={pinned}
        disabled={saving}
        onClick={() => void toggle()}
      >
        {pinned ? (
          <PinOffIcon size={16} aria-hidden />
        ) : (
          <PinIcon size={16} aria-hidden />
        )}
      </Button>
    </Tooltip>
  );
}
