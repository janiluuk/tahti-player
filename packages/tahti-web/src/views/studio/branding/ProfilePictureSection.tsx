import { Tooltip } from '@tahti-player/ui';

import { uploadProfileAvatar } from '../../../api/artist-settings';
import { RoundImageUploadButton } from '../../../components/RoundImageUploadButton';
import { StudioPanel } from '../../../components/StudioPanel';
import type { PressKitState } from './usePressKit';

export function ProfilePictureSection({ kit }: { kit: PressKitState }) {
  const { avatarUrl, handleAvatarChange } = kit;
  return (
    <StudioPanel
      title="Profile picture"
      description="Use a clear square portrait or mark. Hover the picture to replace or remove it."
    >
      <div className="flex flex-wrap items-center gap-5">
        <RoundImageUploadButton
          label="Profile picture"
          value={avatarUrl}
          sizeClassName="size-32"
          upload={(file) =>
            uploadProfileAvatar(file).then((r) =>
              r.ok ? { ok: true as const, data: { url: r.avatarUrl } } : r,
            )
          }
          onChange={handleAvatarChange}
        />
        <div className="flex flex-col gap-2">
          <Tooltip
            side="bottom"
            content={
              <p className="max-w-64 text-xs leading-relaxed">
                JPEG, PNG, or WebP. The original is kept for full-size use.
              </p>
            }
          >
            <span
              tabIndex={0}
              aria-label="Accepted image formats"
              className="text-foreground-secondary hover:text-foreground inline-flex size-4 cursor-help items-center justify-center rounded-full border border-current"
            >
              <span className="text-[10px] leading-none font-bold">?</span>
            </span>
          </Tooltip>
        </div>
      </div>
    </StudioPanel>
  );
}
