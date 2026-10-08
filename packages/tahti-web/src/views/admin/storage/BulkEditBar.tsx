import { useState } from 'react';

import { Button, Select } from '@tahti-player/ui';

import {
  bulkDeleteAdminFiles,
  bulkPatchAdminFiles,
  FILE_LICENSES,
  type AdminFileFacets,
  type AdminFilesBulkPatch,
} from '../../../api/admin';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { contentTypeLabel } from '../../../content/contentTypes';

const UNCHANGED = '';
const CLEAR_GENRE = '__clear__';

export function bulkPatchFromChoices(choices: {
  genre: string;
  contentType: string;
  visibility: string;
  license: string;
}): AdminFilesBulkPatch {
  const patch: AdminFilesBulkPatch = {};
  if (choices.genre === CLEAR_GENRE) {
    patch.genre = null;
  } else if (choices.genre) {
    patch.genre = choices.genre;
  }
  if (choices.contentType) {
    patch.contentType = choices.contentType;
  }
  if (choices.visibility) {
    patch.isPublic = choices.visibility === 'public';
  }
  if (choices.license) {
    patch.license = choices.license;
  }
  return patch;
}

export function BulkEditBar({
  selectedIds,
  facets,
  onClear,
  onApplied,
  onDeleted,
}: {
  selectedIds: string[];
  facets: AdminFileFacets | null;
  onClear: () => void;
  onApplied: (updated: number) => void;
  onDeleted: (deleted: number, kept: number) => void;
}) {
  const [genre, setGenre] = useState(UNCHANGED);
  const [contentType, setContentType] = useState(UNCHANGED);
  const [visibility, setVisibility] = useState(UNCHANGED);
  const [license, setLicense] = useState(UNCHANGED);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const patch = bulkPatchFromChoices({
    genre,
    contentType,
    visibility,
    license,
  });
  const hasChanges = Object.keys(patch).length > 0;
  const count = selectedIds.length;

  return (
    <div
      role="region"
      aria-label="Edit selected files"
      className="border-border bg-background-secondary flex flex-col gap-3 rounded-md border p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium">
          {count} {count === 1 ? 'file' : 'files'} selected
        </span>
        <Button size="sm" variant="text" onClick={onClear}>
          Clear selection
        </Button>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <Select
          label="Genre"
          value={genre}
          onValueChange={setGenre}
          options={[
            { id: UNCHANGED, label: 'Leave as is' },
            { id: CLEAR_GENRE, label: 'Remove genre' },
            ...(facets?.genres ?? []).map((name) => ({
              id: name,
              label: name,
            })),
          ]}
          className="min-w-36"
        />
        <Select
          label="Type"
          value={contentType}
          onValueChange={setContentType}
          options={[
            { id: UNCHANGED, label: 'Leave as is' },
            ...(facets?.contentTypes ?? []).map((type) => ({
              id: type,
              label: contentTypeLabel(type),
            })),
          ]}
          className="min-w-36"
        />
        <Select
          label="Visibility"
          value={visibility}
          onValueChange={setVisibility}
          options={[
            { id: UNCHANGED, label: 'Leave as is' },
            { id: 'public', label: 'Public' },
            { id: 'private', label: 'Private' },
          ]}
          className="min-w-32"
        />
        <Select
          label="License"
          value={license}
          onValueChange={setLicense}
          options={[
            { id: UNCHANGED, label: 'Leave as is' },
            ...FILE_LICENSES.map((option) => ({
              id: option.id,
              label: option.label,
            })),
          ]}
          className="min-w-44"
        />
        <Button
          size="sm"
          disabled={!hasChanges || pending || count === 0}
          onClick={() => {
            setPending(true);
            setError(null);
            void bulkPatchAdminFiles(selectedIds, patch).then((result) => {
              setPending(false);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setGenre(UNCHANGED);
              setContentType(UNCHANGED);
              setVisibility(UNCHANGED);
              setLicense(UNCHANGED);
              onApplied(result.updated);
            });
          }}
        >
          {pending ? 'Applying…' : `Apply to ${count}`}
        </Button>
        <Button
          size="sm"
          intent="danger"
          disabled={pending || count === 0}
          onClick={() => setConfirmingDelete(true)}
        >
          Delete {count}
        </Button>
      </div>
      {error ? (
        <p className="text-accent-red-strong text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <ConfirmDialog
        isOpen={confirmingDelete}
        title={`Delete ${count} ${count === 1 ? 'file' : 'files'} permanently?`}
        description="This removes the selected files from platform storage. It cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          setConfirmingDelete(false);
          setPending(true);
          setError(null);
          void bulkDeleteAdminFiles(selectedIds).then((result) => {
            setPending(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            onDeleted(result.deleted, result.failed.length);
          });
        }}
      />
    </div>
  );
}
