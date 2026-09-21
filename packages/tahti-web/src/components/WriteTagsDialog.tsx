import { LoaderCircleIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, Toggle } from '@tahti-player/ui';

import type {
  NativeWriteTagsPreview,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';

const n = (value: number) => value.toLocaleString('en-US');

type Props = {
  isOpen: boolean;
  onClose: () => void;
  library: TahtiNativeLibrary;
  ids: string[];
  onChanged: () => void;
};

/**
 * Explicit, optional write-back of hand-edited tags into the audio files.
 * Only edited fields of the selected tracks are written; each file is tagged
 * on a copy, verified, then swapped in, and a backup copy is kept beside it
 * unless switched off.
 */
export function WriteTagsDialog({
  isOpen,
  onClose,
  library,
  ids,
  onChanged,
}: Props) {
  const [preview, setPreview] = useState<NativeWriteTagsPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keepBackup, setKeepBackup] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let cancelled = false;
    setPreview(null);
    setError(null);
    library.catalog
      .writeTagsPreview(ids)
      .then((value) => !cancelled && setPreview(value))
      .catch(
        (failure) =>
          !cancelled &&
          setError(
            failure instanceof Error ? failure.message : String(failure),
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [isOpen, ids, library]);

  const write = async () => {
    setBusy(true);
    try {
      const result = await library.catalog.writeTags(ids, keepBackup);
      onChanged();
      onClose();
      const notes = [
        result.failed.length
          ? `${n(result.failed.length)} failed (${result.failed[0]?.reason})`
          : '',
        result.skipped.length ? `${n(result.skipped.length)} skipped` : '',
        result.fieldsUnsupported
          ? `${n(result.fieldsUnsupported)} edited fields have no place in the file format and stay in the library only`
          : '',
      ].filter(Boolean);
      const message = `Wrote tags to ${n(result.written)} ${result.written === 1 ? 'file' : 'files'}.`;
      if (result.failed.length && result.written === 0) {
        toast.error('No files were changed.', {
          description: notes.join('; '),
        });
      } else {
        toast.success(message, {
          description: notes.join('; ') || undefined,
        });
      }
    } catch (failure) {
      toast.error(
        failure instanceof Error ? failure.message : 'Could not write tags.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root
      isOpen={isOpen}
      onClose={() => (busy ? undefined : onClose())}
      className="max-w-lg"
    >
      <Dialog.Title>Write tags to files</Dialog.Title>
      <Dialog.Description>
        Saves your edited fields into the audio files themselves, so other
        players see them too. Tracks with no edits are left alone. Each file is
        tagged on a copy and checked before it replaces the original.
      </Dialog.Description>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : !preview ? (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
          Checking…
        </p>
      ) : (
        <div className="flex max-h-[45vh] flex-col gap-2 overflow-y-auto py-2 text-sm">
          <p role="status">
            {n(preview.writable)} {preview.writable === 1 ? 'file' : 'files'}{' '}
            will be written
            {preview.noEdits ? `; ${n(preview.noEdits)} have no edits` : ''}.
          </p>
          <p className="text-muted-foreground text-xs">
            Supported formats: {preview.formats.join(', ')}. WAV stores no album
            artist or disc number; those edits stay in the library only.
          </p>
          {preview.skipped.length > 0 ? (
            <div className="flex flex-col gap-0.5 text-xs">
              <p className="font-medium">Skipped</p>
              {preview.skipped.slice(0, 8).map((skip) => (
                <p key={skip.path} className="truncate" title={skip.path}>
                  {skip.path} — {skip.reason}
                </p>
              ))}
            </div>
          ) : null}
          <Toggle
            label="Keep a backup copy of each original next to it"
            checked={keepBackup}
            onChange={setKeepBackup}
          />
        </div>
      )}
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button
          disabled={busy || !preview || preview.writable === 0}
          onClick={() => void write()}
        >
          {busy ? (
            <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
          ) : null}
          Write to files
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
