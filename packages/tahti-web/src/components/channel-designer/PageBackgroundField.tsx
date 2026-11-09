import { useTranslation } from '@tahti-player/i18n';
import { ColorField } from '@tahti-player/ui';

import {
  DEFAULT_COLOR_SCHEME,
  type ColorScheme,
} from '../../api/channel-design';

type Props = {
  scheme: ColorScheme;
  backgroundScheme: ColorScheme;
  useBackgroundGradient: boolean;
  onChange: (bg: string) => void;
};

/** Always-visible page background swatch at the top of Backdrop Look. */
export function PageBackgroundField({
  scheme,
  backgroundScheme,
  useBackgroundGradient,
  onChange,
}: Props) {
  const { t } = useTranslation('web');
  const value = useBackgroundGradient
    ? (backgroundScheme.bg ?? scheme.bg ?? DEFAULT_COLOR_SCHEME.bg)
    : (scheme.bg ?? DEFAULT_COLOR_SCHEME.bg);

  return (
    <ColorField
      label={t('pageBackgroundFieldText.pageBackground')}
      value={value}
      onChange={onChange}
    />
  );
}
