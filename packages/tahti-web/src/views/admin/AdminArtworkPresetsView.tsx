import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
  Button,
  MediaArtwork,
  Toggle,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  createAdminArtworkPreset,
  deleteAdminArtworkPreset,
  fetchAdminArtworkPresets,
  patchAdminArtworkPreset,
  type ArtworkPreset,
} from '../../api/artwork-presets';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { ArtworkPresetUploadDialog } from '../../components/ArtworkPresetUploadDialog';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { cn } from '../../lib/cn';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; presets: ArtworkPreset[] };

export function AdminArtworkPresetsView() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ArtworkPreset | null>(
    null,
  );

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    const { data, meta } = await fetchAdminArtworkPresets();
    setState(
      meta.reason && data.length === 0
        ? { status: 'error', message: meta.reason }
        : { status: 'ready', presets: data },
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const replace = (next: ArtworkPreset) =>
    setState((current) =>
      current.status === 'ready'
        ? {
            ...current,
            presets: current.presets.map((preset) =>
              preset.id === next.id ? next : preset,
            ),
          }
        : current,
    );

  const toggle = async (preset: ArtworkPreset, enabled: boolean) => {
    replace({ ...preset, enabled });
    const result = await patchAdminArtworkPreset(preset.id, { enabled });
    if (!result.ok) {
      replace(preset);
      toast.error(result.error);
    }
  };

  const add = async (url: string) => {
    const result = await createAdminArtworkPreset(url);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setState((current) =>
      current.status === 'ready'
        ? { ...current, presets: [...current.presets, result.data] }
        : current,
    );
    toast.success('Artwork added.');
  };

  const remove = async (preset: ArtworkPreset) => {
    const result = await deleteAdminArtworkPreset(preset.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setState((current) =>
      current.status === 'ready'
        ? {
            ...current,
            presets: current.presets.filter((p) => p.id !== preset.id),
          }
        : current,
    );
    toast.success('Artwork removed.');
  };

  return (
    <AdminGate>
      <AdminPageLayout current="/admin/artwork-presets">
        <div className="flex flex-col gap-6">
          <Breadcrumbs>
            <BreadcrumbLink to="/admin">Admin</BreadcrumbLink>
            <BreadcrumbCurrent>Artwork presets</BreadcrumbCurrent>
          </Breadcrumbs>
          <ViewShell
            title="Artwork presets"
            subtitle="Enabled artwork becomes the cover of tracks, playlists and channels that have none, and is offered in every cover picker."
            classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            actions={
              <Tooltip content="Add artwork" side="top">
                <Button
                  type="button"
                  size="icon-sm"
                  aria-label="Add artwork"
                  onClick={() => setUploadOpen(true)}
                >
                  <PlusIcon size={18} aria-hidden />
                </Button>
              </Tooltip>
            }
          >
            {state.status === 'loading' ? (
              <PageLoading label="Loading artwork…" />
            ) : state.status === 'error' ? (
              <PageError
                title="Could not load artwork presets"
                description={state.message}
                onRetry={() => void load()}
              />
            ) : state.presets.length === 0 ? (
              <PageEmpty
                title="No artwork presets yet"
                description="Add artwork to use it as a default cover."
              />
            ) : (
              <ul
                className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6"
                data-testid="artwork-preset-grid"
              >
                {state.presets.map((preset, index) => (
                  <li
                    key={preset.id}
                    className="border-border/40 bg-background-secondary flex list-none flex-col overflow-hidden rounded-lg border"
                  >
                    <MediaArtwork
                      src={preset.url}
                      alt=""
                      imageReveal={false}
                      className={cn(
                        'aspect-square transition-opacity',
                        !preset.enabled && 'opacity-40',
                      )}
                    />
                    <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                      <Toggle
                        label={`Enable artwork ${index + 1}`}
                        checked={preset.enabled}
                        onChange={(checked) => void toggle(preset, checked)}
                      />
                      <Button
                        type="button"
                        variant="text"
                        size="icon-sm"
                        aria-label={`Remove artwork ${index + 1}`}
                        onClick={() => setPendingDelete(preset)}
                      >
                        <Trash2Icon size={14} aria-hidden />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ViewShell>
        </div>
      </AdminPageLayout>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Remove this artwork?"
        description="Covers already saved from it stay as they are."
        confirmLabel="Remove"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const preset = pendingDelete;
          setPendingDelete(null);
          if (preset) {
            void remove(preset);
          }
        }}
      />

      <ArtworkPresetUploadDialog
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={(url) => void add(url)}
      />
    </AdminGate>
  );
}
