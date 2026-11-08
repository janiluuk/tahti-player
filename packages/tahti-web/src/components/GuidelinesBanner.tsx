import { ScrollTextIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Alert, Button, ButtonAnchor } from '@tahti-player/ui';

import { useNotificationInboxStore } from '../stores/notificationInboxStore';

export function GuidelinesBanner() {
  const { t } = useTranslation('web');
  const sticky = useNotificationInboxStore((s) =>
    s.items.find((item) => item.sticky && !item.readAt),
  );
  const acknowledge = useNotificationInboxStore((s) => s.acknowledge);

  if (!sticky) {
    return null;
  }

  return (
    <Alert
      tone="neutral"
      icon={<ScrollTextIcon size={16} className="text-primary" aria-hidden />}
      title={sticky.title}
      data-testid="guidelines-banner"
      className="mb-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>
          {sticky.body ??
            'Please review the community guidelines before continuing.'}
        </span>
        <div className="flex flex-wrap gap-2">
          {sticky.url ? (
            <ButtonAnchor href={sticky.url} size="sm" variant="secondary">
              {t('guidelinesBanner.readGuidelines')}
            </ButtonAnchor>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void acknowledge(sticky.id)}
          >
            {t('guidelinesBanner.acknowledge')}
          </Button>
        </div>
      </div>
    </Alert>
  );
}
