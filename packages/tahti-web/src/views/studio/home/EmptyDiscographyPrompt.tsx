import { PlusIcon } from 'lucide-react';

import { ButtonLink } from '@tahti-player/ui';

import { PageEmpty } from '../../../components/PageStates';
import type { StudioHomeState } from './useStudioHome';

/** The first-run nudge on the dashboard while nothing is uploaded yet. */
export function EmptyDiscographyPrompt({ state }: { state: StudioHomeState }) {
  return state.hasEmptyDiscography ? (
    <PageEmpty
      title="Nothing in your discography yet"
      description="Add an album or a track to start building it out."
      action={
        <div className="flex flex-wrap gap-2">
          <ButtonLink
            to="/studio/releases"
            search={{ create: true }}
            size="sm"
            variant="secondary"
          >
            <PlusIcon size={14} aria-hidden className="mr-1.5" />
            Add an album
          </ButtonLink>
          <ButtonLink to="/library/upload" size="sm">
            <PlusIcon size={14} aria-hidden className="mr-1.5" />
            Add a track
          </ButtonLink>
        </div>
      }
    />
  ) : null;
}
