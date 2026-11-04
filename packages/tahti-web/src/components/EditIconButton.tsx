import { useTranslation } from '@tahti-player/i18n';
import {
  EditIconButton as UiEditIconButton,
  type EditIconButtonProps as UiEditIconButtonProps,
} from '@tahti-player/ui';

export type EditIconButtonProps = UiEditIconButtonProps;

export function EditIconButton({ label, ...rest }: EditIconButtonProps) {
  const { t } = useTranslation('web');
  return <UiEditIconButton label={label ?? t('actions.edit')} {...rest} />;
}
