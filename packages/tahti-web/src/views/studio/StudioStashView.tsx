import { useEffect, useRef, useState } from 'react';

import { Button } from '@nuclearplayer/ui';

import {
  deleteStashFile,
  fetchStashDownload,
  fetchStashFiles,
  uploadStashFile,
  type StashFile,
} from '../../api/sources';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { usePlayerStore } from '../../stores/playerStore';

function fmtSize(bytes?: number): string {
  if (bytes == null) return '';
  if (bytes < 1_000_000) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1_000_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
}

export function StudioStashView() {
  const play = usePlayerStore((s) => s.play);
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<StashFile[]>([]);
  const [source, setSource] = useState('…');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function reload() {
    const r = await fetchStashFiles();
    setFiles(r.data);
    setSource(r.meta.source);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError(null);
    const r = await uploadStashFile(file, setProgress);
    setUploading(false);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
    if (!r.ok) {
      setError(r.error);
      return;
    }
    if (r.meta.source === 'mock') {
      setFiles((prev) => [
        {
          id: r.id,
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setSource('mock');
    } else {
      await reload();
    }
  }

  return (
    <StudioGate>
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <StudioNav current="/studio/stash" />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">
              Stash
            </h1>
            <p className="text-foreground-secondary mt-1 text-sm">
              Private locker (not public archive). Prepare → PUT → register via{' '}
              <code className="text-foreground">/api/me/stash</code>. Source:{' '}
              {source}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              aria-label="Upload file to stash"
              disabled={uploading}
              onChange={(e) => void onPick(e.target.files?.[0])}
            />
            <Button
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? `Uploading… ${progress}%` : 'Upload to stash'}
            </Button>
          </div>
        </div>

        {uploading && (
          <div className="border-border bg-background-secondary/40 h-2 overflow-hidden rounded-full border">
            <div
              className="bg-primary h-full transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {error && (
          <p className="text-foreground-secondary text-sm" role="alert">
            {error}
          </p>
        )}

        {files.length === 0 ? (
          <p className="text-foreground-secondary text-sm">
            No stash files yet — upload stems, zips, or drafts.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {files.map((f) => (
              <li
                key={f.id}
                className="border-border flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
              >
                <div>
                  <div className="text-sm font-medium">{f.filename}</div>
                  <div className="text-foreground-secondary text-xs">
                    {f.contentType ?? 'file'}
                    {f.sizeBytes != null ? ` · ${fmtSize(f.sizeBytes)}` : ''}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busyId === f.id}
                    onClick={() => {
                      setBusyId(f.id);
                      void fetchStashDownload(f.id).then((r) => {
                        setBusyId(null);
                        if (!r.data?.url) {
                          setError('Could not get download URL');
                          return;
                        }
                        play({
                          id: `stash:${f.id}`,
                          kind: 'archive',
                          title: f.filename,
                          artist: 'Stash',
                          streamUrl: r.data.url,
                          protocol: 'https',
                          sourceProvider: 'stash',
                        });
                      });
                    }}
                  >
                    Play
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busyId === f.id}
                    onClick={() => {
                      setBusyId(f.id);
                      void fetchStashDownload(f.id).then((r) => {
                        setBusyId(null);
                        if (!r.data?.url) {
                          setError('Could not get download URL');
                          return;
                        }
                        const a = document.createElement('a');
                        a.href = r.data.url;
                        a.download = f.filename;
                        a.rel = 'noopener';
                        a.target = '_blank';
                        a.click();
                      });
                    }}
                  >
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busyId === f.id}
                    onClick={() => {
                      if (!window.confirm(`Delete ${f.filename} from stash?`)) {
                        return;
                      }
                      setBusyId(f.id);
                      void deleteStashFile(f.id).then((r) => {
                        setBusyId(null);
                        if (!r.ok) {
                          setError(r.error);
                          return;
                        }
                        setFiles((prev) => prev.filter((x) => x.id !== f.id));
                      });
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </StudioGate>
  );
}
