import { HardDriveIcon, PencilIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

import {
  Button,
  Dialog,
  Input,
  Meter,
  SaveButton,
  Tooltip,
} from '@tahti-player/ui';

import {
  setUserStorageQuota,
  type AdminFileRow,
  type AdminStorageDiskSpace,
} from '../../../api/admin';
import { StudioPanel } from '../../../components/StudioPanel';
import { contentTypeLabel } from '../../../content/contentTypes';
import { formatDuration } from '../../../lib/playableToTrack';
import {
  bytesToMb,
  formatBytes,
  formatFileDate,
} from '../../../lib/storageFormat';

export const STORAGE_LOCATION_LABELS: Record<'local' | 'r2', string> = {
  local: 'Local disk',
  r2: 'Object storage (R2)',
};

export type FileSortKey = 'name' | 'type' | 'size' | 'length';

export const SORT_OPTIONS: Array<{ id: FileSortKey; label: string }> = [
  { id: 'name', label: 'Name' },
  { id: 'type', label: 'Type' },
  { id: 'size', label: 'Size' },
  { id: 'length', label: 'Length' },
];

export const STORAGE_TYPE_COLORS = [
  'var(--accent-orange)',
  'var(--accent-purple)',
  'var(--accent-cyan)',
  'var(--accent-green)',
  'var(--accent-yellow)',
  'var(--accent-blue)',
];

export function sortFiles(
  files: AdminFileRow[],
  sortBy: FileSortKey,
): AdminFileRow[] {
  const sorted = [...files];
  switch (sortBy) {
    case 'type':
      sorted.sort((a, b) =>
        contentTypeLabel(a.contentType).localeCompare(
          contentTypeLabel(b.contentType),
        ),
      );
      break;
    case 'size':
      sorted.sort((a, b) => (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0));
      break;
    case 'length':
      sorted.sort((a, b) => (b.durationSec ?? 0) - (a.durationSec ?? 0));
      break;
    case 'name':
    default:
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }
  return sorted;
}

export function FileDetailDialog({
  file,
  onClose,
}: {
  file: AdminFileRow;
  onClose: () => void;
}) {
  return (
    <Dialog.Root isOpen onClose={onClose} className="max-w-lg">
      <Dialog.Title>{file.title}</Dialog.Title>
      <Dialog.Description>
        Full file record — everything currently tracked for this upload.
      </Dialog.Description>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            Filename
          </dt>
          <dd className="font-medium break-all">{file.title}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">Type</dt>
          <dd>{contentTypeLabel(file.contentType)}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            Uploader
          </dt>
          <dd>
            {file.displayName} · @{file.username}
          </dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            Uploaded
          </dt>
          <dd>{formatFileDate(file.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            Total size
          </dt>
          <dd>{formatBytes(file.sizeBytes)}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            Length
          </dt>
          <dd>
            {file.durationSec != null ? formatDuration(file.durationSec) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            Revisions
          </dt>
          <dd>{file.revisionCount}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            Storage location
          </dt>
          <dd>
            {file.storageLocation
              ? STORAGE_LOCATION_LABELS[file.storageLocation]
              : 'Not tracked yet'}
          </dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            Visibility
          </dt>
          <dd>{file.isPublic ? 'Public' : 'Private'}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">Genre</dt>
          <dd>{file.genre ?? '—'}</dd>
        </div>
      </dl>
      <Dialog.Actions>
        <Dialog.Close>Close</Dialog.Close>
      </Dialog.Actions>
    </Dialog.Root>
  );
}

export function QuotaEditor({
  userId,
  quotaBytes,
  displayName,
  onSaved,
}: {
  userId: string;
  quotaBytes: number;
  displayName: string;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(bytesToMb(quotaBytes)));
  const [saving, setSaving] = useState(false);

  if (!editing) {
    return (
      <Tooltip content="Edit quota" side="top">
        <Button
          size="icon-sm"
          variant="text"
          aria-label={`Edit quota for ${displayName}`}
          onClick={() => {
            setValue(String(bytesToMb(quotaBytes)));
            setEditing(true);
          }}
        >
          <PencilIcon size={14} aria-hidden />
        </Button>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        size="sm"
        min={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20"
        disabled={saving}
        aria-label={`Quota in MB for ${displayName}`}
      />
      <span className="text-foreground-secondary text-xs">MB</span>
      <SaveButton
        size="sm"
        saving={saving}
        title="Save quota"
        onClick={() => {
          const mb = Number(value);
          if (!Number.isFinite(mb) || mb <= 0) {
            return;
          }
          setSaving(true);
          void setUserStorageQuota(userId, Math.round(mb * 1024 * 1024)).then(
            () => {
              setSaving(false);
              setEditing(false);
              onSaved();
            },
          );
        }}
      />
      <Tooltip content="Cancel" side="top">
        <Button
          size="icon-sm"
          variant="text"
          aria-label="Cancel editing quota"
          onClick={() => setEditing(false)}
        >
          <XIcon size={14} aria-hidden />
        </Button>
      </Tooltip>
    </div>
  );
}

export function DiskSpaceCard({
  icon: Icon,
  title,
  space,
}: {
  icon: typeof HardDriveIcon;
  title: string;
  space: AdminStorageDiskSpace;
}) {
  const pctUsed =
    space.totalBytes != null && space.totalBytes > 0 && space.usedBytes != null
      ? (space.usedBytes / space.totalBytes) * 100
      : null;

  return (
    <StudioPanel>
      <div className="mb-3 flex items-center gap-2">
        <Icon size={18} aria-hidden className="text-primary" />
        <h3 className="font-display text-base font-bold">{title}</h3>
      </div>
      <dl className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">Used</dt>
          <dd className="font-semibold">{formatBytes(space.usedBytes)}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">Free</dt>
          <dd className="font-semibold">{formatBytes(space.freeBytes)}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">Total</dt>
          <dd className="font-semibold">{formatBytes(space.totalBytes)}</dd>
        </div>
      </dl>
      {pctUsed != null ? <Meter value={pctUsed} className="mt-3" /> : null}
      {space.note ? (
        <p className="text-foreground-secondary mt-3 text-xs">{space.note}</p>
      ) : null}
    </StudioPanel>
  );
}
