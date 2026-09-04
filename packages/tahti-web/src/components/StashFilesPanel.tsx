import { PlayIcon, Share2Icon, Trash2Icon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  EmptyState,
  FilePicker,
  Input,
  Select,
  Tooltip,
} from '@tahti-player/ui';

import {
  createStashShare,
  deleteStashFile,
  fetchStashDownload,
  fetchStashFiles,
  revokeStashShare,
  uploadStashFile,
  type StashFile,
} from '../api/sources';
import {
  fetchStudioCollections,
  fetchStudioSounds,
  patchStudioCollection,
  patchStudioSound,
} from '../api/studio';
import type { StudioCollection, StudioSound } from '../api/studio-types';
import { usePlayerStore } from '../stores/playerStore';
import { ConfirmDialog } from './ConfirmDialog';
import { StudioPanel } from './StudioPanel';

const EXPIRY_OPTIONS = [1, 3, 7, 30, 0] as const;
const MILLISECONDS_PER_DAY = 86_400_000;

const formatExpiry = (expiresAt: string | null) => {
  if (!expiresAt) {
    return 'Permanent';
  }
  const remainingDays = Math.max(
    0,
    Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / MILLISECONDS_PER_DAY,
    ),
  );
  if (remainingDays === 0) {
    return 'Expired';
  }
  return `${remainingDays} day${remainingDays === 1 ? '' : 's'} left`;
};

export const StashFilesPanel = () => {
  const play = usePlayerStore((state) => state.play);
  const [files, setFiles] = useState<StashFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sharingFileId, setSharingFileId] = useState<string | null>(null);
  const [granteeUsername, setGranteeUsername] = useState('');
  const [permission, setPermission] = useState<'READ' | 'DOWNLOAD'>('DOWNLOAD');
  const [expiryDays, setExpiryDays] = useState(7);
  const [archiveItems, setArchiveItems] = useState<StudioSound[]>([]);
  const [collections, setCollections] = useState<StudioCollection[]>([]);
  const [pendingDelete, setPendingDelete] = useState<StashFile | null>(null);

  const reload = () =>
    fetchStashFiles().then((result) => {
      setFiles(result.data);
    });

  useEffect(() => {
    void reload();
    void Promise.all([fetchStudioSounds(), fetchStudioCollections()]).then(
      ([archive, collectionResult]) => {
        setArchiveItems(archive.data);
        setCollections(collectionResult.data);
      },
    );
  }, []);

  const moveTrackToStash = async (item: StudioSound) => {
    setBusy(true);
    const result = await patchStudioSound(item.id, {
      visibility: 'PRIVATE',
      isPublic: false,
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setArchiveItems((current) =>
      current.filter((candidate) => candidate.id !== item.id),
    );
    setMessage(`${item.title} moved to your private stash.`);
  };

  const moveCollectionToStash = async (collection: StudioCollection) => {
    setBusy(true);
    const result = await patchStudioCollection(collection.slug, {
      visibility: 'PRIVATE',
      isPublic: false,
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setCollections((current) =>
      current.filter((candidate) => candidate.slug !== collection.slug),
    );
    setMessage(`${collection.name} moved to your private stash.`);
  };

  const createShare = async (file: StashFile) => {
    setBusy(true);
    setMessage(null);
    const username = granteeUsername.trim().replace(/^@/, '');
    const result = await createStashShare(file.id, {
      permission,
      ...(username ? { granteeUsername: username } : {}),
      ...(expiryDays > 0 ? { expiresInDays: expiryDays } : {}),
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setFiles((current) =>
      current.map((candidate) =>
        candidate.id === file.id
          ? {
              ...candidate,
              shareCount: candidate.shareCount + 1,
              shares: [...candidate.shares, result.data],
            }
          : candidate,
      ),
    );
    setSharingFileId(null);
    setGranteeUsername('');
    setMessage(
      username
        ? `Shared ${file.filename} with @${username}.`
        : `Created access for ${file.filename}.`,
    );
  };

  const revokeShare = async (fileId: string, shareId: string) => {
    setBusy(true);
    setMessage(null);
    const result = await revokeStashShare(shareId);
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setFiles((current) =>
      current.map((file) =>
        file.id === fileId
          ? {
              ...file,
              shareCount: Math.max(0, file.shareCount - 1),
              shares: file.shares.filter((share) => share.id !== shareId),
            }
          : file,
      ),
    );
    setMessage('Share access revoked.');
  };

  const uploadFile = (file: File) => {
    setBusy(true);
    setMessage(null);
    void uploadStashFile(file).then((result) => {
      setBusy(false);
      if (!result.ok) {
        setMessage(result.error);
        toast.error(result.error);
        return;
      }
      setMessage(`Uploaded ${file.name}`);
      toast.success(`Uploaded ${file.name}`);
      void reload();
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <FilePicker
        disabled={busy}
        labels={{
          title: busy ? 'Uploading…' : 'Upload a private file',
          description: 'Files stay private until you grant access.',
          browse: busy ? 'Working…' : 'Choose file',
        }}
        onFiles={(picked) => {
          const file = picked[0];
          if (file) {
            uploadFile(file);
          }
        }}
      />

      {message ? (
        <p className="text-foreground-secondary text-sm" role="status">
          {message}
        </p>
      ) : null}

      <StudioPanel
        title="Add from your library"
        description="Move tracks and collections into your private stash. Private items are removed from public listings."
      >
        {archiveItems.length === 0 && collections.length === 0 ? (
          <EmptyState
            size="sm"
            title="Nothing to move"
            description="Everything in your library is already private or there is nothing to move."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {archiveItems
              .filter(
                (item) =>
                  item.visibility !== 'PRIVATE' && item.isPublic !== false,
              )
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate">{item.title}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void moveTrackToStash(item)}
                  >
                    Move track
                  </Button>
                </div>
              ))}
            {collections
              .filter(
                (collection) =>
                  collection.visibility !== 'PRIVATE' &&
                  collection.isPublic !== false,
              )
              .map((collection) => (
                <div
                  key={collection.slug}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate">{collection.name}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void moveCollectionToStash(collection)}
                  >
                    Move collection
                  </Button>
                </div>
              ))}
          </div>
        )}
      </StudioPanel>

      <StudioPanel>
        {files.length === 0 ? (
          <EmptyState size="sm" title="No stash files yet" />
        ) : (
          <ul className="divide-border divide-y">
            {files.map((file) => (
              <li key={file.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{file.filename}</div>
                    <div className="text-foreground-secondary text-xs">
                      {file.contentType ?? 'file'}
                      {file.sizeBytes != null
                        ? ` · ${Math.round(Number(file.sizeBytes) / 1024)} KB`
                        : ''}
                      {` · ${file.shareCount} share${file.shareCount === 1 ? '' : 's'}`}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Tooltip content="Share access" side="top">
                      <Button
                        size="icon-sm"
                        variant={
                          sharingFileId === file.id ? 'secondary' : 'text'
                        }
                        aria-label={`Share ${file.filename}`}
                        aria-pressed={sharingFileId === file.id}
                        onClick={() =>
                          setSharingFileId((current) =>
                            current === file.id ? null : file.id,
                          )
                        }
                      >
                        <Share2Icon size={16} />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Play" side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        aria-label={`Play ${file.filename}`}
                        onClick={() => {
                          void fetchStashDownload(file.id).then((result) => {
                            if (!result.data?.url) {
                              setMessage('Download is unavailable.');
                              return;
                            }
                            play({
                              id: `stash:${file.id}`,
                              kind: 'archive',
                              title: file.filename,
                              artist: 'Stash',
                              streamUrl: result.data.url,
                              protocol: 'https',
                              sourceProvider: 'stash',
                            });
                          });
                        }}
                      >
                        <PlayIcon size={16} className="fill-current" />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Delete" side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        aria-label={`Delete ${file.filename}`}
                        onClick={() => setPendingDelete(file)}
                      >
                        <Trash2Icon size={16} />
                      </Button>
                    </Tooltip>
                  </div>
                </div>

                {sharingFileId === file.id ? (
                  <div className="border-border bg-background-secondary mt-3 grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Input
                        label="Share with"
                        value={granteeUsername}
                        onChange={(event) =>
                          setGranteeUsername(event.target.value)
                        }
                        placeholder="@username, or leave empty for link access"
                      />
                    </div>
                    <Select
                      label="Permission"
                      value={permission}
                      onValueChange={(value) =>
                        setPermission(value as 'READ' | 'DOWNLOAD')
                      }
                      options={[
                        { id: 'READ', label: 'Read-only' },
                        { id: 'DOWNLOAD', label: 'Download' },
                      ]}
                    />
                    <Select
                      label="Expires"
                      value={String(expiryDays)}
                      onValueChange={(value) => setExpiryDays(Number(value))}
                      options={EXPIRY_OPTIONS.map((days) => ({
                        id: String(days),
                        label:
                          days === 0
                            ? 'Never'
                            : `${days} day${days === 1 ? '' : 's'}`,
                      }))}
                    />
                    <div className="flex justify-end sm:col-span-2">
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => void createShare(file)}
                      >
                        <Share2Icon size={14} aria-hidden className="mr-1.5" />
                        Grant access
                      </Button>
                    </div>
                  </div>
                ) : null}

                {file.shares.length > 0 ? (
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {file.shares.map((share) => (
                      <li
                        key={share.id}
                        className="border-border flex items-center gap-2 rounded-md border px-3 py-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">
                            {share.granteeUsername
                              ? `@${share.granteeUsername}`
                              : 'Link access'}
                          </div>
                          <div className="text-foreground-secondary">
                            {share.permission === 'DOWNLOAD'
                              ? 'Download'
                              : 'Read-only'}{' '}
                            · {formatExpiry(share.expiresAt)}
                          </div>
                        </div>
                        <Tooltip content="Revoke access" side="top">
                          <Button
                            size="icon-sm"
                            variant="text"
                            aria-label={`Revoke access for ${share.granteeUsername ? `@${share.granteeUsername}` : 'link'}`}
                            disabled={busy}
                            onClick={() => void revokeShare(file.id, share.id)}
                          >
                            <XIcon size={14} aria-hidden />
                          </Button>
                        </Tooltip>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </StudioPanel>
      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title={
          pendingDelete ? `Delete "${pendingDelete.filename}"?` : 'Delete file?'
        }
        description="This removes the file from your stash."
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const file = pendingDelete;
          setPendingDelete(null);
          if (!file) {
            return;
          }
          void deleteStashFile(file.id).then((result) => {
            if (!result.ok) {
              setMessage(result.error);
              return;
            }
            setFiles((current) =>
              current.filter((candidate) => candidate.id !== file.id),
            );
            setMessage(`Deleted ${file.filename}.`);
          });
        }}
      />
    </div>
  );
};
