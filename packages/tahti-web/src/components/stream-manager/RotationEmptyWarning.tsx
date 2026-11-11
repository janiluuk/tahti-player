import { TriangleAlertIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Alert, ButtonLink } from '@tahti-player/ui';

import { useAuthStore } from '../../stores/authStore';

export function RotationEmptyWarning({ slug }: { slug: string }) {
  const { t } = useTranslation('web');
  const ownsChannel = useAuthStore((s) => s.user?.channel?.slug === slug);

  return (
    <Alert
      tone="warning"
      icon={<TriangleAlertIcon size={16} aria-hidden />}
      title={t('rotationEmptyWarning.the247RotationIs')}
    >
      <div className="flex flex-col items-start gap-2">
        <p>{t('rotationEmptyWarning.nothingWillPlayOnThis')}</p>
        {/* The studio link only reaches the viewer's own channel, so board
            members looking at someone else's channel get the warning alone. */}
        {ownsChannel ? (
          <ButtonLink
            to="/studio/channel"
            search={{ radio: 'rotation' }}
            hash="radio"
            size="sm"
            variant="secondary"
          >
            {t('rotationEmptyWarning.manage247Rotation')}
          </ButtonLink>
        ) : null}
      </div>
    </Alert>
  );
}
