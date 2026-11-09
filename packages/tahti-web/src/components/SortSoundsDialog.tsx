import {
  ArrowDownToLineIcon,
  ArrowUpToLineIcon,
  GripVerticalIcon,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  MediaArtwork,
  SaveButton,
  Select,
  Tooltip,
} from '@tahti-player/ui';

import { cn } from '../lib/cn';
import {
  moveSound,
  sortSounds,
  type SortableSound,
  type SoundSortMode,
} from '../lib/sortSounds';
import { ListingDate } from './ListingDate';

const MODES: SoundSortMode[] = [
  'OWN',
  'NEWEST',
  'OLDEST',
  'TITLE_ASC',
  'TITLE_DESC',
];

const KEY_STEPS: Record<string, (index: number, last: number) => number> = {
  ArrowUp: (index) => index - 1,
  ArrowDown: (index) => index + 1,
  Home: () => 0,
  End: (_index, last) => last,
};

/** Sort a collection's sounds: pick a sort, or drag / arrow-key / jump
 * entries into your own order, then save. */
export function SortSoundsDialog({
  isOpen,
  sounds,
  initialMode,
  onSave,
  onClose,
}: {
  isOpen: boolean;
  sounds: SortableSound[];
  initialMode: SoundSortMode;
  onSave: (
    ids: string[],
    mode: SoundSortMode,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  onClose: () => void;
}) {
  const { t } = useTranslation('web');
  const [own, setOwn] = useState(sounds);
  const [mode, setMode] = useState<SoundSortMode>(initialMode);
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const handles = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    if (isOpen) {
      setOwn(sounds);
      setMode(initialMode);
      setAnnouncement('');
    }
  }, [isOpen, sounds, initialMode]);

  useEffect(() => {
    if (focusId) {
      handles.current.get(focusId)?.focus();
    }
  }, [focusId, own]);

  const shown = sortSounds(own, mode);

  const move = (from: number, to: number) => {
    const next = moveSound(shown, from, to);
    if (next === shown) {
      return;
    }
    const moved = shown[from]!;
    setOwn(next);
    setMode('OWN');
    setFocusId(moved.id);
    setAnnouncement(
      t('sortSounds.moved', {
        title: moved.title,
        position: next.indexOf(moved) + 1,
        count: next.length,
      }),
    );
  };

  const onHandleKey = (event: KeyboardEvent, index: number) => {
    const step = KEY_STEPS[event.key];
    if (!step) {
      return;
    }
    event.preventDefault();
    move(index, step(index, shown.length - 1));
  };

  const onDrop = (event: DragEvent, index: number) => {
    event.preventDefault();
    const from = shown.findIndex((sound) => sound.id === dragId);
    setDragId(null);
    if (from >= 0) {
      move(from, index);
    }
  };

  const save = async () => {
    setSaving(true);
    const result = await onSave(
      shown.map((sound) => sound.id),
      mode,
    );
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(t('toasts.orderSaved'));
    onClose();
  };

  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <Dialog.Title>{t('sortSounds.title')}</Dialog.Title>
      <div className="flex flex-col gap-3 pt-2">
        <Select
          label={t('sortSounds.sortBy')}
          options={MODES.map((id) => ({
            id,
            label: t(`sortSounds.mode.${id}`),
          }))}
          value={mode}
          onValueChange={(next) => setMode(next as SoundSortMode)}
        />
        <p className="text-foreground-secondary text-sm">
          {t('sortSounds.hint')}
        </p>
        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>
        <ol
          aria-label={t('sortSounds.title')}
          className="border-border divide-border max-h-[55vh] divide-y overflow-y-auto rounded-md border"
        >
          {shown.map((sound, index) => (
            <li
              key={sound.id}
              data-testid="sort-sounds-row"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onDrop(event, index)}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5',
                dragId === sound.id && 'opacity-50',
              )}
            >
              <Button
                ref={(node) => {
                  if (node) {
                    handles.current.set(sound.id, node);
                  } else {
                    handles.current.delete(sound.id);
                  }
                }}
                variant="text"
                size="icon-sm"
                draggable
                aria-label={t('sortSounds.handle', { title: sound.title })}
                aria-keyshortcuts="ArrowUp ArrowDown Home End"
                className="cursor-grab"
                onDragStart={() => setDragId(sound.id)}
                onDragEnd={() => setDragId(null)}
                onKeyDown={(event) => onHandleKey(event, index)}
              >
                <GripVerticalIcon size={16} aria-hidden />
              </Button>
              <span className="text-foreground-secondary w-6 text-right text-xs tabular-nums">
                {index + 1}
              </span>
              <MediaArtwork
                src={sound.artworkUrl ?? undefined}
                seed={sound.id}
                alt=""
                size="sm"
                className="shrink-0 rounded"
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">
                  {sound.title}
                </span>
                {sound.date ? (
                  <ListingDate
                    value={sound.date}
                    className="text-foreground-secondary text-xs"
                  />
                ) : null}
              </span>
              <Tooltip content={t('sortSounds.toTop')} side="top">
                <Button
                  variant="text"
                  size="icon-sm"
                  aria-label={t('sortSounds.toTopNamed', {
                    title: sound.title,
                  })}
                  disabled={index === 0}
                  onClick={() => move(index, 0)}
                >
                  <ArrowUpToLineIcon size={15} aria-hidden />
                </Button>
              </Tooltip>
              <Tooltip content={t('sortSounds.toBottom')} side="top">
                <Button
                  variant="text"
                  size="icon-sm"
                  aria-label={t('sortSounds.toBottomNamed', {
                    title: sound.title,
                  })}
                  disabled={index === shown.length - 1}
                  onClick={() => move(index, shown.length - 1)}
                >
                  <ArrowDownToLineIcon size={15} aria-hidden />
                </Button>
              </Tooltip>
            </li>
          ))}
        </ol>
      </div>
      <Dialog.Actions>
        <Dialog.Close>{t('actions.cancel')}</Dialog.Close>
        <SaveButton
          label={t('sortSounds.save')}
          saving={saving}
          disabled={shown.length === 0}
          onClick={() => void save()}
        />
      </Dialog.Actions>
    </Dialog.Root>
  );
}
