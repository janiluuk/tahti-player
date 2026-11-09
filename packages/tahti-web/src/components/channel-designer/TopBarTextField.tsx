import { useTranslation } from '@tahti-player/i18n';
import { Input, Toggle } from '@tahti-player/ui';

export const TOP_BAR_TEXT_MAX_LENGTH = 120;

type Visibility = {
  showSiteSidebar?: boolean;
  showSiteBottomBar?: boolean;
  showSiteHeader?: boolean;
};

type Props = {
  visibility?: Visibility;
  onVisibilityChange?: (next: Visibility) => void;
  value: string;
  onChange: (next: string) => void;
};

/** Short line shown in a strip across the top of the channel hero. */
export function TopBarTextField({
  value,
  onChange,
  visibility = {},
  onVisibilityChange,
}: Props) {
  const { t } = useTranslation('web');
  return (
    <section className="border-border flex flex-col gap-3 rounded-lg border p-3">
      <h2 className="text-xs font-semibold tracking-wide uppercase">
        {t('topBarTextField.artistWebsite')}
      </h2>
      <p className="text-foreground-secondary text-xs">
        {t('topBarTextField.artistWebsiteHint')}
      </p>
      {onVisibilityChange &&
        (
          [
            ['showSiteSidebar', false],
            ['showSiteBottomBar', false],
            ['showSiteHeader', true],
          ] as const
        ).map(([key, fallback]) => (
          <Toggle
            showLabel
            labelPosition="start"
            key={key}
            label={t(`topBarTextField.${key}`)}
            checked={visibility[key] ?? fallback}
            onChange={(checked) => onVisibilityChange({ [key]: checked })}
          />
        ))}
      <Input
        label={t('topBarTextField.topBarText')}
        value={value}
        maxLength={TOP_BAR_TEXT_MAX_LENGTH}
        placeholder="e.g. New album out Friday"
        onChange={(event) => onChange(event.target.value)}
      />
    </section>
  );
}
