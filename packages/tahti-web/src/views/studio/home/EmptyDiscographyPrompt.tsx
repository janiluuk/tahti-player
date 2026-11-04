import { PlusIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { ButtonLink } from '@tahti-player/ui';

import { PageEmpty } from '../../../components/PageStates';
import type { StudioHomeState } from './useStudioHome';

/** The first-run nudge on the dashboard while nothing is uploaded yet. */
export function EmptyDiscographyPrompt({ state }: { state: StudioHomeState }) {
  const { t } = useTranslation('web');
  return state.hasEmptyDiscography ? (
    <PageEmpty
      title={t('studioHub.emptyDiscographyTitle')}
      description={t('studioHub.emptyDiscographyDescription')}
      action={
        <div className="flex flex-wrap gap-2">
          <ButtonLink
            to="/studio/releases"
            search={{ create: true }}
            size="sm"
            variant="secondary"
          >
            <PlusIcon size={14} aria-hidden className="mr-1.5" />
            {t('studioHub.addAlbum')}
          </ButtonLink>
          <ButtonLink to="/library/upload" size="sm">
            <PlusIcon size={14} aria-hidden className="mr-1.5" />
            {t('studioHub.addTrack')}
          </ButtonLink>
        </div>
      }
    />
  ) : null;
}
