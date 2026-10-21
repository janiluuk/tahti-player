import { FileUpIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  FilePicker,
  Textarea,
  Tooltip,
} from '@tahti-player/ui';

import {
  importReleasesCsv,
  RELEASE_CSV_COLUMNS,
  type ReleaseImportResult,
} from '../../api/release-import';

export function ReleaseCsvImportButton({
  onImported,
}: {
  onImported: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ReleaseImportResult | null>(null);

  const close = () => {
    setOpen(false);
    setCsv('');
    setResult(null);
  };

  const readFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    setCsv(await file.text());
    setResult(null);
  };

  const submit = async () => {
    setBusy(true);
    const res = await importReleasesCsv(csv);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setResult(res.data);
    if (res.data.created > 0) {
      toast.success(
        `Created ${res.data.created} release${res.data.created === 1 ? '' : 's'}.`,
      );
      onImported();
    }
  };

  return (
    <>
      <Tooltip content="Import from CSV" side="top">
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label="Import releases from CSV"
          onClick={() => setOpen(true)}
        >
          <FileUpIcon size={16} aria-hidden />
        </Button>
      </Tooltip>
      <Dialog.Root isOpen={open} onClose={close} className="max-w-xl">
        <Dialog.Title>Import releases from CSV</Dialog.Title>
        <Dialog.Description>
          One row per track. Rows with the same release title and date become
          one draft release. Columns: {RELEASE_CSV_COLUMNS.join(', ')}.
        </Dialog.Description>
        <div className="flex flex-col gap-3 py-4">
          <FilePicker
            accept=".csv,text/csv"
            labels={{
              title: 'Choose a CSV file',
              description: 'Or paste the rows below.',
              browse: 'Browse',
            }}
            onFiles={(files) => void readFile(files[0])}
          />
          <Textarea
            aria-label="CSV rows"
            rows={8}
            value={csv}
            onChange={(event) => {
              setCsv(event.target.value);
              setResult(null);
            }}
            placeholder="releaseTitle,type,releaseDate,trackTitle&#10;Night Drive,EP,2026-10-01,Intro"
            className="font-mono text-xs"
          />
          {result ? (
            <div className="text-sm" role="status">
              <p>
                Created {result.created}, skipped {result.skipped}.
              </p>
              {result.errors.length > 0 ? (
                <ul className="text-accent-red-strong mt-1 list-disc pl-5 text-xs">
                  {result.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
        <Dialog.Actions>
          <Dialog.Close>{result ? 'Done' : 'Cancel'}</Dialog.Close>
          <Button onClick={() => void submit()} disabled={busy || !csv.trim()}>
            {busy ? 'Importing…' : 'Import'}
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
}
