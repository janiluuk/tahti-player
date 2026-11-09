import { FolderOpenIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  Input,
  Loader,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import type {
  NativeOrganizeOptions,
  NativeOrganizePlan,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { ConfirmDialog } from './ConfirmDialog';

const n = (value: number) => value.toLocaleString('en-US');
const files = (count: number) => (count === 1 ? 'file' : 'files');

const DEFAULT_TEMPLATE = '{albumArtist}/{album}/{disc}{track} - {title}';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  library: TahtiNativeLibrary;
  ids: string[];
  onChanged: () => void;
};

/**
 * Optional: copy or move the selected tracks into a folder layout built from
 * their tags. Always previews first; files are never overwritten, and a move
 * (which changes the originals) asks for a second confirmation.
 */
export function OrganizeFilesDialog({
  isOpen,
  onClose,
  library,
  ids,
  onChanged,
}: Props) {
  const { t } = useTranslation('web');
  const [destination, setDestination] = useState('');
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [move, setMove] = useState(false);
  const [keepBoth, setKeepBoth] = useState(true);
  const [plan, setPlan] = useState<NativeOrganizePlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmingMove, setConfirmingMove] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPlan(null);
      setError(null);
      setConfirmingMove(false);
    }
  }, [isOpen]);

  const options = (): NativeOrganizeOptions => ({
    ids,
    destination,
    template,
    collision: keepBoth ? 'suffix' : 'skip',
    mode: move ? 'move' : 'copy',
  });

  // Any change to the inputs makes the shown preview stale.
  useEffect(() => {
    setPlan(null);
    setError(null);
  }, [destination, template, move, keepBoth]);

  useEffect(() => {
    if (!isOpen || !destination || !template.trim()) {
      return;
    }
    let cancelled = false;
    setChecking(true);
    library.catalog
      .organizePreview({
        ids,
        destination,
        template,
        collision: keepBoth ? 'suffix' : 'skip',
        mode: move ? 'move' : 'copy',
      })
      .then((value) => !cancelled && setPlan(value))
      .catch(
        (failure) =>
          !cancelled &&
          setError(
            failure instanceof Error ? failure.message : String(failure),
          ),
      )
      .finally(() => !cancelled && setChecking(false));
    return () => {
      cancelled = true;
    };
  }, [isOpen, ids, library, destination, template, move, keepBoth]);

  const pick = async () => {
    try {
      const folder = await library.catalog.organizePickDestination();
      if (folder) {
        setDestination(folder);
      }
    } catch (failure) {
      toast.error(
        failure instanceof Error ? failure.message : 'Could not pick a folder.',
      );
    }
  };

  const run = async () => {
    setConfirmingMove(false);
    setBusy(true);
    try {
      const result = await library.catalog.organizeApply(options(), move);
      onChanged();
      onClose();
      const notes = [
        result.skipped ? `${n(result.skipped)} left alone` : '',
        result.errors.length
          ? `${n(result.errors.length)} failed (${result.errors[0]})`
          : '',
      ].filter(Boolean);
      if (result.errors.length && result.done === 0) {
        toast.error(i18n.t('web:toasts.noFilesOrganized'), {
          description: notes.join('; '),
        });
      } else {
        toast.success(
          move
            ? t('organizeFilesDialogStates.movedFiles', { count: result.done })
            : t('organizeFilesDialogStates.copiedFiles', {
                count: result.done,
              }),
          {
            description: notes.join('; ') || undefined,
          },
        );
      }
    } catch (failure) {
      toast.error(
        failure instanceof Error
          ? failure.message
          : 'Could not organize files.',
      );
    } finally {
      setBusy(false);
    }
  };

  const canRun = !busy && !checking && plan !== null && plan.ready > 0;

  return (
    <>
      <Dialog.Root
        isOpen={isOpen}
        onClose={() => (busy ? undefined : onClose())}
        className="max-w-xl"
      >
        <Dialog.Title>{t('organizeFiles.organizeFiles')}</Dialog.Title>
        <Dialog.Description>
          {t('organizeFiles.putsTheSelectedTracksInto')}
        </Dialog.Description>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (move) {
              setConfirmingMove(true);
            } else {
              void run();
            }
          }}
        >
          <div className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto py-2 text-sm">
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <Input
                  label={t('organizeFiles.destinationFolder')}
                  value={destination}
                  readOnly
                  placeholder={t('organizeFiles.chooseAFolder')}
                />
              </div>
              <Button
                className="gap-1.5"
                variant="secondary"
                onClick={() => void pick()}
              >
                <FolderOpenIcon size={14} aria-hidden />
                {t('organizeFiles.choose')}
              </Button>
            </div>
            <Input
              label={t('organizeFiles.layout')}
              value={template}
              onChange={(event) => setTemplate(event.target.value)}
              placeholder={DEFAULT_TEMPLATE}
            />
            <p className="text-foreground-secondary text-xs">
              Use {'{artist}'}, {'{albumArtist}'}, {'{album}'}, {'{title}'},{' '}
              {'{track}'}, {'{disc}'}, {'{year}'}, {'{genre}'}; “/” starts a
              folder. The file extension is kept.
            </p>
            <Toggle
              label={t('organizeFiles.moveFilesInsteadOfCopying')}
              checked={move}
              onChange={setMove}
            />
            <Toggle
              label={t('organizeFiles.ifAFileAlreadyExists')}
              checked={keepBoth}
              onChange={setKeepBoth}
            />
            {error ? (
              <p role="alert" className="text-accent-red-strong">
                {error}
              </p>
            ) : checking ? (
              <p className="text-foreground-secondary flex items-center gap-2">
                <Loader size="inline" shape="circle" />
                {t('organizeFiles.checking')}
              </p>
            ) : plan ? (
              <div className="flex flex-col gap-1">
                <p role="status">
                  {n(plan.ready)} {files(plan.ready)} will be{' '}
                  {move ? 'moved' : 'copied'}
                  {plan.unchanged
                    ? `; ${n(plan.unchanged)} already in place`
                    : ''}
                  {plan.collisions
                    ? `; ${n(plan.collisions)} skipped (name taken)`
                    : ''}
                  {plan.missing ? `; ${n(plan.missing)} missing on disk` : ''}.
                </p>
                {!move && plan.originalsInWatchedFolders > 0 ? (
                  <p className="text-foreground-secondary text-xs">
                    {n(plan.originalsInWatchedFolders)} originals sit in a
                    watched folder and will be added again as new tracks by the
                    next scan.
                  </p>
                ) : null}
                {plan.items
                  .filter((item) => item.status === 'ready')
                  .slice(0, 5)
                  .map((item) => (
                    <Tooltip
                      key={item.id}
                      content={`${item.from} → ${item.to}`}
                      side="top"
                    >
                      <p className="text-foreground-secondary truncate text-xs">
                        → {item.to}
                      </p>
                    </Tooltip>
                  ))}
              </div>
            ) : null}
          </div>
          <Dialog.Actions>
            <Dialog.Close>{t('organizeFiles.cancel')}</Dialog.Close>
            <Button className="gap-1.5" disabled={!canRun} type="submit">
              {busy ? <Loader size="inline" shape="circle" /> : null}
              {move
                ? t('organizeFilesDialogStates.moveFiles')
                : t('organizeFilesDialogStates.copyFiles')}
            </Button>
          </Dialog.Actions>
        </form>
      </Dialog.Root>
      <ConfirmDialog
        isOpen={confirmingMove}
        title={t('organizeFiles.moveTheseFiles')}
        description={`This moves ${n(plan?.ready ?? 0)} ${files(plan?.ready ?? 0)} out of their current folders into ${destination}. Other programs that use the old locations will no longer find them.`}
        confirmLabel={t('organizeFiles.moveFiles')}
        destructive
        onCancel={() => setConfirmingMove(false)}
        onConfirm={() => void run()}
      />
    </>
  );
}
