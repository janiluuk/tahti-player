import { PlusIcon, RotateCcwIcon, UploadIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button, Dialog, Input, Tooltip, ViewShell } from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { ArtworkPresetUploadDialog } from '../../components/ArtworkPresetUploadDialog';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import {
  GENERATED_ARTWORK_COUNT,
  generatedArtworkUrl,
} from '../../lib/placeholderArt';
import { useAuthStore } from '../../stores/authStore';

function storageKey(userId: string) {
  return `tahti-admin-artwork-presets:${userId}`;
}

/** The 16 built-in generated placeholders — fixed content, fixed order,
 * never mutated. A slot can be overridden (see `assignments`), but the
 * default itself always stays available to revert back to. */
const DEFAULT_ARTWORKS: string[] = Array.from(
  { length: GENERATED_ARTWORK_COUNT },
  (_, index) => generatedArtworkUrl(String(index)),
);

const DEFAULT_NAMES = DEFAULT_ARTWORKS.map(
  (_, index) => `Artwork ${index + 1}`,
);

type SavedState = {
  /** Default-slot index -> the custom-pool URL currently assigned to it.
   * A slot with no entry here just shows its own DEFAULT_ARTWORKS image. */
  assignments: Record<number, string>;
  /** Every custom image the admin has ever uploaded — kept around after a
   * reset so it can be re-assigned later without re-uploading. */
  customPool: string[];
};

function parseSavedState(raw: string): SavedState | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'assignments' in parsed &&
      'customPool' in parsed
    ) {
      const { assignments, customPool } = parsed as Record<string, unknown>;
      if (
        assignments &&
        typeof assignments === 'object' &&
        Array.isArray(customPool) &&
        customPool.every((v): v is string => typeof v === 'string')
      ) {
        const cleanAssignments: Record<number, string> = {};
        for (const [key, value] of Object.entries(
          assignments as Record<string, unknown>,
        )) {
          const index = Number(key);
          if (
            Number.isInteger(index) &&
            index >= 0 &&
            index < GENERATED_ARTWORK_COUNT &&
            typeof value === 'string'
          ) {
            cleanAssignments[index] = value;
          }
        }
        return { assignments: cleanAssignments, customPool };
      }
    }
  } catch {
    // fall through
  }
  return null;
}

export function AdminArtworkPresetsView() {
  const userId = useAuthStore((s) => s.user?.id);
  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const [customPool, setCustomPool] = useState<string[]>([]);
  const [selected, setSelected] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  /** "slot" (opened from within the editor) auto-assigns the upload to the
   * slot being edited; "pool" (the top-right "Add new" action) just adds it
   * to the library without assigning it anywhere. */
  const [uploadTarget, setUploadTarget] = useState<'slot' | 'pool'>('slot');

  const activeUrls = useMemo(
    () => DEFAULT_ARTWORKS.map((url, index) => assignments[index] ?? url),
    [assignments],
  );
  const selectedUrl = activeUrls[selected] ?? '';
  const selectedIsCustom = assignments[selected] != null;

  useEffect(() => {
    if (!userId) {
      return;
    }
    const stored = window.localStorage.getItem(storageKey(userId));
    if (!stored) {
      return;
    }
    const parsed = parseSavedState(stored);
    if (parsed) {
      setAssignments(parsed.assignments);
      setCustomPool(parsed.customPool);
    } else {
      window.localStorage.removeItem(storageKey(userId));
    }
  }, [userId]);

  const persist = (next: SavedState) => {
    if (!userId) {
      return;
    }
    window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
  };

  const resetToDefaults = () => {
    setAssignments({});
    persist({ assignments: {}, customPool });
  };

  const assignToSelected = (url: string) => {
    setAssignments((current) => ({ ...current, [selected]: url }));
  };

  const openSlotEditor = (index: number) => {
    setSelected(index);
    setEditorOpen(true);
  };

  const saveEditor = () => {
    persist({ assignments, customPool });
    setEditorOpen(false);
  };

  return (
    <AdminGate>
      <AdminPageLayout current="/admin/artwork-presets">
        <div className="flex flex-col gap-6">
          <ViewShell
            title="Artwork presets"
            classes={{ root: 'px-0 pt-0' }}
            actions={
              <div className="flex items-center gap-1.5">
                <Tooltip content="Add new artwork" side="top">
                  <Button
                    type="button"
                    size="icon-sm"
                    aria-label="Add new artwork"
                    onClick={() => {
                      setUploadTarget('pool');
                      setUploadOpen(true);
                    }}
                  >
                    <PlusIcon size={18} aria-hidden />
                  </Button>
                </Tooltip>
                <Tooltip content="Reset to defaults" side="top">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-sm"
                    aria-label="Reset to defaults"
                    onClick={() => setResetConfirmOpen(true)}
                  >
                    <RotateCcwIcon size={15} aria-hidden />
                  </Button>
                </Tooltip>
              </div>
            }
          >
            <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {DEFAULT_ARTWORKS.map((_, index) => (
                <button
                  key={DEFAULT_NAMES[index]}
                  type="button"
                  onClick={() => openSlotEditor(index)}
                  className={`border-border overflow-hidden rounded-lg border text-left ${selected === index && editorOpen ? 'ring-primary ring-2' : ''}`}
                  aria-label={`Edit ${DEFAULT_NAMES[index]}`}
                >
                  <img
                    src={activeUrls[index]}
                    alt=""
                    className="aspect-square w-full"
                  />
                  <span className="block px-2 py-1 text-xs">
                    {DEFAULT_NAMES[index]}
                    {assignments[index] != null ? ' · custom' : ''}
                  </span>
                </button>
              ))}
            </div>
          </ViewShell>
        </div>
      </AdminPageLayout>

      <Dialog.Root
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        className="max-w-md"
      >
        <Dialog.Title>{DEFAULT_NAMES[selected] ?? 'Edit artwork'}</Dialog.Title>
        <div className="flex flex-col gap-4">
          <div className="group relative aspect-square w-full max-w-64">
            <img
              src={selectedUrl}
              alt="Selected artwork preset"
              className="h-full w-full rounded-xl object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setUploadTarget('slot');
                setUploadOpen(true);
              }}
              aria-label={`Upload artwork for ${DEFAULT_NAMES[selected] ?? 'this slot'}`}
              className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100"
            >
              <UploadIcon size={28} aria-hidden className="text-white" />
            </button>
          </div>
          <Input
            label="Editing slot"
            value={DEFAULT_NAMES[selected] ?? ''}
            readOnly
            description={
              selectedIsCustom
                ? 'Showing a custom artwork assigned to this slot instead of its default.'
                : "Showing this slot's default artwork — assign a custom one below, or upload a new one."
            }
          />
          {customPool.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-foreground text-sm font-semibold">
                Assign from your artwork
              </span>
              <div className="flex flex-wrap gap-2">
                {customPool.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => assignToSelected(url)}
                    aria-label="Assign this artwork to the selected slot"
                    className={`size-12 overflow-hidden rounded-md border ${assignments[selected] === url ? 'border-primary ring-primary ring-2' : 'border-border'}`}
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setUploadTarget('slot');
                    setUploadOpen(true);
                  }}
                  aria-label="Upload a new artwork"
                  title="Upload a new artwork"
                  className="border-border text-foreground-secondary flex size-12 items-center justify-center rounded-md border border-dashed"
                >
                  <PlusIcon size={16} aria-hidden />
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <Dialog.Actions>
          <Dialog.Close>Cancel</Dialog.Close>
          <Button type="button" onClick={saveEditor}>
            Save
          </Button>
        </Dialog.Actions>
      </Dialog.Root>

      <ConfirmDialog
        isOpen={resetConfirmOpen}
        title="Reset artwork presets?"
        description="This clears every custom artwork assignment and reverts all slots to their default images. Uploaded artwork stays in your library."
        confirmLabel="Reset"
        onCancel={() => setResetConfirmOpen(false)}
        onConfirm={() => {
          setResetConfirmOpen(false);
          resetToDefaults();
        }}
      />

      <ArtworkPresetUploadDialog
        isOpen={uploadOpen}
        label={
          uploadTarget === 'pool'
            ? 'your library'
            : (DEFAULT_NAMES[selected] ?? 'preset')
        }
        onClose={() => setUploadOpen(false)}
        onUploaded={(url) => {
          setCustomPool((current) =>
            current.includes(url) ? current : [...current, url],
          );
          if (uploadTarget === 'slot') {
            assignToSelected(url);
          }
        }}
      />
    </AdminGate>
  );
}
