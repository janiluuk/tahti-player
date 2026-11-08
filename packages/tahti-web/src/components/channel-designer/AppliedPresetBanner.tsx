import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

type Props = {
  presetName: string;
  onRevert: () => void;
  onKeep: () => void;
};

/** Shown after applying a saved preset, asking whether to keep it or
 * revert to what was last saved. */
export function AppliedPresetBanner({ presetName, onRevert, onKeep }: Props) {
  const { t } = useTranslation('web');
  return (
    <div className="border-primary/40 bg-primary/10 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm">
      <span>
        {t('appliedPresetBanner.applied')}{' '}
        <strong>&ldquo;{presetName}&rdquo;</strong>. Keep this look, or revert
        to what was last saved?
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={onRevert}>
          {t('appliedPresetBanner.revert')}
        </Button>
        <Button size="sm" onClick={onKeep}>
          {t('appliedPresetBanner.keep')}
        </Button>
      </div>
    </div>
  );
}
