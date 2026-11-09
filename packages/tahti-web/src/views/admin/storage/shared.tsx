import { HardDriveIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  EditIconButton,
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

export function sortOptions(
  t: TFunction<'web'>,
): Array<{ id: FileSortKey; label: string }> {
  return [
    { id: 'name', label: t('storageShared.name') },
    { id: 'type', label: t('storageShared.type') },
    { id: 'size', label: t('storageShared.size') },
    { id: 'length', label: t('storageShared.length') },
  ];
}

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
  const { t } = useTranslation('web');
  return (
    <Dialog.Root isOpen onClose={onClose} className="max-w-lg">
      <Dialog.Title>{file.title}</Dialog.Title>
      <Dialog.Description>
        {t('adminStorageShared.fullFileRecordEverythingCurrently')}
      </Dialog.Description>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            {t('adminStorageShared.filename')}
          </dt>
          <dd className="font-medium break-all">{file.title}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            {t('adminStorageShared.type')}
          </dt>
          <dd>{contentTypeLabel(file.contentType)}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            {t('adminStorageShared.uploader')}
          </dt>
          <dd>
            {file.displayName} · @{file.username}
          </dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            {t('adminStorageShared.uploaded')}
          </dt>
          <dd>{formatFileDate(file.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            {t('adminStorageShared.totalSize')}
          </dt>
          <dd>{formatBytes(file.sizeBytes)}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            {t('adminStorageShared.length')}
          </dt>
          <dd>
            {file.durationSec != null ? formatDuration(file.durationSec) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            {t('adminStorageShared.revisions')}
          </dt>
          <dd>{file.revisionCount}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            {t('adminStorageShared.storageLocation')}
          </dt>
          <dd>
            {file.storageLocation
              ? STORAGE_LOCATION_LABELS[file.storageLocation]
              : 'Not tracked yet'}
          </dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            {t('adminStorageShared.visibility')}
          </dt>
          <dd>{file.isPublic ? 'Public' : 'Private'}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            {t('adminStorageShared.genre')}
          </dt>
          <dd>{file.genre ?? '—'}</dd>
        </div>
      </dl>
      <Dialog.Actions>
        <Dialog.Close>{t('adminStorageShared.close')}</Dialog.Close>
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
  const { t } = useTranslation('web');
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(bytesToMb(quotaBytes)));
  const [saving, setSaving] = useState(false);

  if (!editing) {
    return (
      <EditIconButton
        variant="text"
        label={t('adminStorageSharedLabels.editQuotaForDisplayname', {
          displayName,
        })}
        onClick={() => {
          setValue(String(bytesToMb(quotaBytes)));
          setEditing(true);
        }}
      />
    );
  }

  return (
    <form
      className="flex items-center gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        const mb = Number(value);
        if (!Number.isFinite(mb) || mb <= 0) {
          return;
        }
        setSaving(true);
        void setUserStorageQuota(userId, Math.round(mb * 1024 * 1024)).then(
          (result) => {
            setSaving(false);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            setEditing(false);
            onSaved();
          },
        );
      }}
    >
      <Input
        type="number"
        inputMode="numeric"
        enterKeyHint="done"
        size="sm"
        min={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20"
        disabled={saving}
        aria-label={t('adminStorageSharedLabels.quotaInMbForDisplayname', {
          displayName,
        })}
      />
      <span className="text-foreground-secondary text-xs">MB</span>
      <SaveButton
        size="sm"
        saving={saving}
        title={t('adminStorageShared.saveQuota')}
        type="submit"
      />
      <Tooltip content={t('adminStorageShared.cancel')} side="top">
        <Button
          size="icon-sm"
          variant="text"
          aria-label={t('adminStorageShared.cancelEditingQuota')}
          onClick={() => setEditing(false)}
        >
          <XIcon size={14} aria-hidden />
        </Button>
      </Tooltip>
    </form>
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
  const { t } = useTranslation('web');
  const pctUsed =
    space.totalBytes != null && space.totalBytes > 0 && space.usedBytes != null
      ? (space.usedBytes / space.totalBytes) * 100
      : null;

  return (
    <StudioPanel>
      <div className="mb-3 flex items-center gap-2">
        <Icon size={18} aria-hidden className="text-primary-strong" />
        <h2 className="font-display text-base font-bold">{title}</h2>
      </div>
      <dl className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            {t('adminStorageShared.used')}
          </dt>
          <dd className="font-semibold">{formatBytes(space.usedBytes)}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            {t('adminStorageShared.free')}
          </dt>
          <dd className="font-semibold">{formatBytes(space.freeBytes)}</dd>
        </div>
        <div>
          <dt className="text-foreground-secondary text-xs uppercase">
            {t('adminStorageShared.total')}
          </dt>
          <dd className="font-semibold">{formatBytes(space.totalBytes)}</dd>
        </div>
      </dl>
      {pctUsed != null ? (
        <Meter
          value={pctUsed}
          aria-label={`${title} used`}
          aria-valuetext={`${Math.round(pctUsed)}%`}
          className="mt-3"
        />
      ) : null}
      {space.note ? (
        <p className="text-foreground-secondary mt-3 text-xs">{space.note}</p>
      ) : null}
    </StudioPanel>
  );
}
