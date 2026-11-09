import { useTranslation } from '@tahti-player/i18n';
import { Badge } from '@tahti-player/ui';

import type { ArtistEventStatus } from '../../api/events';

export function EventStatusBadge({
  status,
  showPublished = false,
}: {
  status: ArtistEventStatus;
  showPublished?: boolean;
}) {
  const { t } = useTranslation('web');
  if (status === 'DRAFT') {
    return (
      <Badge variant="pill" color="secondary">
        {t('events.statusDraft')}
      </Badge>
    );
  }
  if (status === 'CANCELLED') {
    return (
      <Badge variant="pill" color="red">
        {t('events.statusCancelled')}
      </Badge>
    );
  }
  return showPublished ? (
    <Badge variant="pill" color="green">
      {t('events.statusPublished')}
    </Badge>
  ) : null;
}
