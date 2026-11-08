import { ShuffleIcon, SlidersHorizontalIcon } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button, Dialog, FilterChips } from '@tahti-player/ui';

import { ALL_FILTER_ID, allOrSpecific } from '../../lib/allOrSpecific';
import { PRESET_GENRES } from '../../lib/genres';

const GENRE_ITEMS = [
  { id: ALL_FILTER_ID, label: 'All genres' },
  ...PRESET_GENRES.map((genre) => ({ id: genre, label: genre })),
];

/** The random-track widget's genre pills, genre dialog and re-roll. */
export function RandomTrackGenres({
  genres,
  onChange,
  onShuffle,
  shuffleDisabled = false,
}: {
  genres: string[];
  onChange: (genres: string[]) => void;
  onShuffle: () => void;
  shuffleDisabled?: boolean;
}) {
  const { t } = useTranslation('web');
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-start justify-between gap-2">
      <ul
        className="flex min-w-0 flex-wrap gap-1"
        aria-label={t('randomGenres.randomTrackGenres')}
      >
        {(genres.length > 0 ? genres : ['All genres']).map((genre) => (
          <li key={genre} className="list-none">
            <Badge variant="pill">{genre}</Badge>
          </li>
        ))}
      </ul>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          size="icon-sm"
          variant="text"
          aria-label={t('randomGenres.chooseGenres')}
          title={t('randomGenres.chooseGenres')}
          onClick={() => setOpen(true)}
        >
          <SlidersHorizontalIcon size={14} aria-hidden />
        </Button>
        <Button
          size="icon-sm"
          variant="text"
          aria-label={t('randomGenres.anotherRandomTrack')}
          title={t('randomGenres.anotherRandomTrack')}
          disabled={shuffleDisabled}
          onClick={onShuffle}
        >
          <ShuffleIcon size={14} aria-hidden />
        </Button>
      </div>
      <Dialog.Root isOpen={open} onClose={() => setOpen(false)}>
        <Dialog.Title>{t('randomGenres.randomTrackGenres')}</Dialog.Title>
        <Dialog.Description>
          {t('randomGenres.pickTheGenresToDraw')}
        </Dialog.Description>
        <FilterChips
          className="mt-4"
          aria-label={t('randomGenres.genres')}
          multiple
          items={GENRE_ITEMS}
          selected={genres.length > 0 ? genres : [ALL_FILTER_ID]}
          onChange={(selected) => onChange(allOrSpecific(selected, genres))}
        />
        <Dialog.Actions>
          <Dialog.Close>{t('randomGenres.done')}</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
    </div>
  );
}
