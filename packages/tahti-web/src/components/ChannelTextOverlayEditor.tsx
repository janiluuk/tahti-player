import { useTranslation } from '@tahti-player/i18n';
import { Input, Select } from '@tahti-player/ui';

import {
  TEXT_OVERLAY_ALIGN_LABELS,
  TEXT_OVERLAY_ALIGNMENTS,
  TEXT_OVERLAY_MODE_LABELS,
  TEXT_OVERLAY_MODES,
  type TextOverlayAlign,
  type TextOverlayMode,
} from '../api/channel-design';

export type TextOverlayDraft = {
  mode: TextOverlayMode | string;
  text: string;
  align: TextOverlayAlign | string;
};

const MODE_OPTIONS = TEXT_OVERLAY_MODES.map((id) => ({
  id,
  label: TEXT_OVERLAY_MODE_LABELS[id],
}));

const ALIGN_OPTIONS = TEXT_OVERLAY_ALIGNMENTS.map((id) => ({
  id,
  label: TEXT_OVERLAY_ALIGN_LABELS[id],
}));

/** Effect + text + alignment picker shared by the channel page's Text
 * overlay block and the player stage's Overlay tab — adapted from
 * tahti-org's channel editor (channel-text-layer-panel.tsx) to this repo's
 * UI kit. Controlled: the canvas block re-renders live as the artist types
 * (see ChannelTextOverlayView), the surrounding designer's own Save button
 * persists the result. */
export function ChannelTextOverlayEditor({
  value,
  onChange,
}: {
  value: TextOverlayDraft;
  onChange: (next: TextOverlayDraft) => void;
}) {
  const { t } = useTranslation('web');
  return (
    <div className="flex flex-col gap-3">
      <Select
        label={t('textOverlayEditor.textEffect')}
        options={MODE_OPTIONS}
        value={value.mode}
        onValueChange={(mode) => onChange({ ...value, mode })}
      />
      {value.mode !== 'NONE' && (
        <>
          <Input
            label={t('textOverlayEditor.yourText')}
            description={t('textOverlayEditor.shortHeadlineOrTaglineMax')}
            size="sm"
            value={value.text}
            maxLength={120}
            placeholder={t('textOverlayEditor.newAlbumOutNowListen')}
            onChange={(e) => onChange({ ...value, text: e.target.value })}
          />
          <Select
            label={t('textOverlayEditor.alignment')}
            options={ALIGN_OPTIONS}
            value={value.align}
            onValueChange={(align) => onChange({ ...value, align })}
          />
        </>
      )}
    </div>
  );
}
