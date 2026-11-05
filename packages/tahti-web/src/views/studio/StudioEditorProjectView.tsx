import { Link, useNavigate } from '@tanstack/react-router';
import { AudioLinesIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, ButtonLink, InlineError, ViewShell } from '@tahti-player/ui';

import {
  deleteEditorProject,
  fetchEditorProject,
  fetchEditorSource,
  updateEditorProject,
} from '../../api/studio';
import type {
  EditorProjectDetail,
  EditorSource,
  EditorTimeline,
} from '../../api/studio-types';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ListingDate } from '../../components/ListingDate';
import {
  MultitrackTimeline,
  normalizeTimeline,
} from '../../components/MultitrackTimeline';
import { PageBackLink } from '../../components/PageBackLink';
import { PageEmpty, PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';

export function StudioEditorProjectView({ id }: { id: string }) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const [project, setProject] = useState<EditorProjectDetail | null>(null);
  const [timeline, setTimeline] = useState<EditorTimeline | null>(null);
  const [sources, setSources] = useState<EditorSource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>(
    'saved',
  );
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    void fetchEditorProject(id).then(async (res) => {
      setProject(res.data);
      if (res.meta.source === 'api' && res.meta.reason) {
        setError(res.meta.reason);
      }
      let resolved: EditorSource[] = (res.data.sources ?? [])
        .filter(
          (source): source is { id: string; title: string; url: string } =>
            Boolean(source.url),
        )
        .map((source) => ({
          url: source.url,
          title: source.title,
          sourceKey: source.id,
          durationSec: null,
        }));
      if (!resolved.length && res.data.soundId) {
        const source = await fetchEditorSource(res.data.soundId);
        if (source.data.url) {
          resolved = [{ ...source.data, sourceKey: res.data.soundId }];
        } else {
          setError('The archive source is unavailable.');
        }
      }
      setSources(resolved);
      setTimeline(normalizeTimeline(res.data.timeline, resolved[0]));
    });
  }, [id]);

  useEffect(() => {
    if (!timeline || !project) {
      return;
    }
    setSaveState('saving');
    const timer = window.setTimeout(() => {
      void updateEditorProject(id, timeline).then((result) =>
        setSaveState(result.ok ? 'saved' : 'error'),
      );
    }, 500);
    return () => window.clearTimeout(timer);
  }, [id, project, timeline]);

  const removeProject = () => {
    if (deleting) {
      return;
    }
    setDeleting(true);
    void deleteEditorProject(id).then((result) => {
      if (result.ok) {
        void navigate({ to: '/studio/editor' });
      } else {
        setError(result.error);
        setDeleting(false);
      }
    });
  };

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-1 py-2">
        <PageBackLink to="/studio/editor" label="Editor" />
        {!project ? (
          <StudioPanel>
            <PageLoading label="Loading project…" />
          </StudioPanel>
        ) : (
          <>
            <ViewShell title={project.title} classes={{ root: 'px-0 pt-0' }}>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmDelete(true)}
                  disabled={deleting}
                  aria-label={`Delete ${project.title}`}
                >
                  <Trash2Icon size={16} aria-hidden className="mr-1.5" />
                  Delete
                </Button>
                {project.soundId ? (
                  <ButtonLink
                    to="/studio/sounds/$id/editor"
                    params={{ id: project.soundId }}
                    size="sm"
                    variant="secondary"
                    aria-label={`Open ${project.title}`}
                  >
                    <AudioLinesIcon size={16} aria-hidden className="mr-1.5" />
                    Pro editor
                  </ButtonLink>
                ) : null}
              </div>
              {error && <InlineError>{error}</InlineError>}
              {timeline && (
                <StudioPanel
                  title="Timeline"
                  description="Arrange native archive clips into a non-destructive multitrack session."
                  action={
                    <span
                      className="text-foreground-secondary text-xs"
                      role="status"
                    >
                      {saveState === 'saving'
                        ? 'Saving…'
                        : saveState === 'error'
                          ? 'Save failed'
                          : 'Saved'}
                    </span>
                  }
                >
                  <MultitrackTimeline
                    value={timeline}
                    sources={sources}
                    onChange={setTimeline}
                    unavailableSourceIds={sources
                      .filter((source) => !source.url)
                      .map((source) => source.sourceKey ?? '')}
                  />
                </StudioPanel>
              )}
              <StudioPanel title="Session">
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-foreground-secondary text-xs uppercase">
                      Updated
                    </dt>
                    <dd className="mt-0.5">
                      <ListingDate value={project.updatedAt} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-foreground-secondary text-xs uppercase">
                      Sound link
                    </dt>
                    <dd className="mt-0.5">
                      {project.soundId ? (
                        <Link
                          to="/studio/sounds/$id"
                          params={{ id: project.soundId }}
                          className="underline-offset-2 hover:underline"
                        >
                          Open in Library
                        </Link>
                      ) : (
                        'None'
                      )}
                    </dd>
                  </div>
                </dl>
                {!project.soundId && (
                  <PageEmpty
                    className="mt-4"
                    title={t('empties.noArchiveSeed')}
                    description={t('empties.createAProjectFromAnArchive')}
                  />
                )}
              </StudioPanel>
            </ViewShell>
          </>
        )}
        <ConfirmDialog
          isOpen={confirmDelete}
          title={
            project
              ? t('studioEditorProject.deleteTitleNamed', {
                  title: project.title,
                })
              : t('studioEditorProject.deleteTitle')
          }
          description={t('studioEditorProject.deleteDescription')}
          confirmLabel={t('actions.delete')}
          destructive
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            removeProject();
          }}
        />
      </div>
    </StudioGate>
  );
}
