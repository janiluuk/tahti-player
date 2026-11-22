import { Link } from '@tanstack/react-router';

import { useTranslation } from '@tahti-player/i18n';

import { useSettingsModalStore } from '../../stores/settingsModalStore';

const linkClass =
  'text-primary-strong inline-flex min-h-6 items-center text-sm font-semibold underline-offset-2 hover:underline';

export function OpenMyChannelLink({
  channelSlug,
  username,
}: {
  channelSlug?: string;
  username: string;
}) {
  const { t } = useTranslation('web');
  const close = () => useSettingsModalStore.getState().close();
  const label = t('channelDesignerText.openMyChannel');
  return channelSlug ? (
    <Link
      to="/channel/$slug"
      params={{ slug: channelSlug }}
      onClick={close}
      className={linkClass}
    >
      {label}
    </Link>
  ) : (
    <Link
      to="/u/$username"
      params={{ username }}
      onClick={close}
      className={linkClass}
    >
      {label}
    </Link>
  );
}
