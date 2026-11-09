import {
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  ImageIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
  Button,
  Dialog,
  EditIconButton,
  Input,
  SaveButton,
  Textarea,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  createNewsPost,
  deleteNewsPost,
  fetchAdminNews,
  updateNewsPost,
  type AdminNewsPost,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminHubBreadcrumb } from '../../components/AdminHubBreadcrumb';
import { AdminPageLayout } from '../../components/AdminNav';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ImageUploadField } from '../../components/ImageUploadField';
import { ListingDate } from '../../components/ListingDate';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import { apiResult, useSnapshotFetch } from '../../lib/useSnapshotFetch';
import { AdminTestNotificationPanel } from './AdminTestNotificationPanel';

export function AdminNewsView() {
  const { t } = useTranslation('web');

  const [composeOpen, setComposeOpen] = useState(false);
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHeadline, setEditHeadline] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editLinkUrl, setEditLinkUrl] = useState('');
  const [editLinkLabel, setEditLinkLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pendingDeletePost, setPendingDeletePost] =
    useState<AdminNewsPost | null>(null);

  const snapshot = useSnapshotFetch<AdminNewsPost[]>('admin-news', async () =>
    apiResult(await fetchAdminNews()),
  );
  const posts = snapshot.data ?? [];
  const { loading, error: loadError, retry: reload } = snapshot;

  const closeCompose = () => {
    setComposeOpen(false);
    setHeadline('');
    setSummary('');
    setImageUrl('');
    setLinkUrl('');
    setLinkLabel('');
    setBusy(false);
  };

  const startEdit = (post: AdminNewsPost) => {
    setEditingId(post.id);
    setEditHeadline(post.headline);
    setEditSummary(post.summary);
    setEditImageUrl(post.imageUrl ?? '');
    setEditLinkUrl(post.linkUrl ?? '');
    setEditLinkLabel(post.linkLabel ?? '');
  };

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/news">
          <div className="flex flex-col gap-6">
            <Breadcrumbs>
              <BreadcrumbLink to="/admin">
                {t('adminNews.admin')}
              </BreadcrumbLink>
              <AdminHubBreadcrumb hub="content" />
              <BreadcrumbCurrent>{t('adminNews.news')}</BreadcrumbCurrent>
            </Breadcrumbs>
            <ViewShell
              title={t('adminNews.news')}
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
              actions={
                <Tooltip content={t('adminNews.writePost')} side="top">
                  <Button
                    size="icon-sm"
                    onClick={() => setComposeOpen(true)}
                    aria-label={t('adminNews.writePost')}
                  >
                    <PlusIcon size={16} aria-hidden />
                  </Button>
                </Tooltip>
              }
            >
              {msg && (
                <p className="text-foreground-secondary text-sm" role="status">
                  {msg}
                </p>
              )}

              <StudioPanel>
                {loading ? (
                  <PageLoading label={t('loading.loadingNews')} />
                ) : loadError && posts.length === 0 ? (
                  <PageError
                    title={t('loadErrors.couldNotLoadNewsPosts')}
                    description={loadError}
                    onRetry={reload}
                  />
                ) : posts.length === 0 ? (
                  <PageEmpty
                    title={t('empties.noNewsPostsYet')}
                    action={
                      <Tooltip content={t('adminNews.writePost')} side="top">
                        <Button
                          size="icon-sm"
                          onClick={() => setComposeOpen(true)}
                          aria-label={t('adminNews.writePost')}
                        >
                          <PlusIcon size={16} aria-hidden />
                        </Button>
                      </Tooltip>
                    }
                  />
                ) : (
                  <ul className="divide-border divide-y">
                    {posts.map((post) =>
                      editingId === post.id ? (
                        <li key={post.id} className="py-3 first:pt-0 last:pb-0">
                          <form
                            className="flex flex-col gap-3"
                            onSubmit={(event) => {
                              event.preventDefault();
                              setBusy(true);
                              void updateNewsPost(post.id, {
                                headline: editHeadline.trim(),
                                summary: editSummary.trim(),
                                imageUrl: editImageUrl.trim() || null,
                                linkUrl: editLinkUrl.trim() || null,
                                linkLabel: editLinkLabel.trim() || null,
                              }).then((r) => {
                                setBusy(false);
                                if (!r.ok) {
                                  setMsg(r.error);
                                  return;
                                }
                                setEditingId(null);
                                reload();
                              });
                            }}
                          >
                            <Input
                              label={t('adminNews.headline')}
                              value={editHeadline}
                              onChange={(e) => setEditHeadline(e.target.value)}
                            />
                            <Textarea
                              submitOnModEnter
                              label={t('adminNews.summary')}
                              tone="secondary"
                              value={editSummary}
                              onChange={(e) => setEditSummary(e.target.value)}
                              rows={3}
                            />
                            <ImageUploadField
                              label={t('adminNews.newsImage')}
                              description={t('adminNews.jpegPngWebpOrGif')}
                              value={editImageUrl}
                              onChange={setEditImageUrl}
                            />
                            <Input
                              inputMode="url"
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck={false}
                              label={t('adminNews.linkUrl')}
                              value={editLinkUrl}
                              onChange={(event) =>
                                setEditLinkUrl(event.target.value)
                              }
                              placeholder="https://…"
                            />
                            <Input
                              label={t('adminNews.linkLabel')}
                              value={editLinkLabel}
                              onChange={(event) =>
                                setEditLinkLabel(event.target.value)
                              }
                              placeholder={t('adminNews.readMore')}
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="text"
                                onClick={() => setEditingId(null)}
                              >
                                {t('adminNews.cancel')}
                              </Button>
                              <SaveButton saving={busy} type="submit" />
                            </div>
                          </form>
                        </li>
                      ) : (
                        <li
                          key={post.id}
                          className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                        >
                          <div className="min-w-0 flex-1 basis-64">
                            <div className="flex items-center gap-2 font-medium">
                              {post.imageUrl ? (
                                <>
                                  <ImageIcon
                                    size={14}
                                    aria-hidden
                                    className="text-primary-strong"
                                  />
                                  <span className="sr-only">
                                    {t('adminNews.includesImage')}
                                  </span>
                                </>
                              ) : null}
                              {post.linkUrl ? (
                                <>
                                  <ExternalLinkIcon
                                    size={14}
                                    aria-hidden
                                    className="text-primary-strong"
                                  />
                                  <span className="sr-only">
                                    {t('adminNews.includesLink')}
                                  </span>
                                </>
                              ) : null}
                              {post.headline}
                            </div>
                            <p className="text-foreground-secondary text-xs">
                              By {post.authorName} ·{' '}
                              {post.publishedAt ? (
                                <>
                                  Published{' '}
                                  <ListingDate value={post.publishedAt} />
                                </>
                              ) : (
                                'Draft'
                              )}
                            </p>
                            <p className="mt-1 text-sm">{post.summary}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <EditIconButton
                              label={t('adminNewsViewLabels.editHeadline', {
                                headline: post.headline,
                              })}
                              variant="text"
                              onClick={() => startEdit(post)}
                            />
                            <Button
                              size="sm"
                              variant="text"
                              onClick={() => {
                                void updateNewsPost(post.id, {
                                  publish: !post.publishedAt,
                                }).then((r) => {
                                  if (!r.ok) {
                                    setMsg(r.error);
                                  } else {
                                    reload();
                                  }
                                });
                              }}
                            >
                              {post.publishedAt ? (
                                <EyeOffIcon
                                  size={14}
                                  aria-hidden
                                  className="mr-1.5"
                                />
                              ) : (
                                <EyeIcon
                                  size={14}
                                  aria-hidden
                                  className="mr-1.5"
                                />
                              )}
                              {post.publishedAt ? 'Unpublish' : 'Publish'}
                            </Button>
                            <Button
                              size="sm"
                              variant="text"
                              aria-label={t(
                                'adminNewsViewLabels.deleteHeadline',
                                { headline: post.headline },
                              )}
                              onClick={() => setPendingDeletePost(post)}
                            >
                              <Trash2Icon
                                size={14}
                                aria-hidden
                                className="text-accent-red-strong mr-1.5"
                              />
                              {t('adminNews.delete')}
                            </Button>
                          </div>
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </StudioPanel>
              <AdminTestNotificationPanel />
            </ViewShell>

            <Dialog.Root isOpen={composeOpen} onClose={closeCompose}>
              <Dialog.Title>{t('adminNews.writeANewsPost')}</Dialog.Title>
              <form
                className="mt-4 flex flex-col gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  setBusy(true);
                  void createNewsPost({
                    headline: headline.trim(),
                    summary: summary.trim(),
                    imageUrl: imageUrl.trim() || undefined,
                    linkUrl: linkUrl.trim() || undefined,
                    linkLabel: linkLabel.trim() || undefined,
                    publish: true,
                  }).then((r) => {
                    setBusy(false);
                    if (!r.ok) {
                      setMsg(r.error);
                      return;
                    }
                    closeCompose();
                    reload();
                  });
                }}
              >
                <Input
                  label={t('adminNews.headline')}
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  autoFocus
                />
                <Textarea
                  label={t('adminNews.shortSummary')}
                  tone="secondary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  submitOnModEnter
                />
                <ImageUploadField
                  label={t('adminNews.newsImage')}
                  description={t('adminNews.jpegPngWebpOrGif')}
                  value={imageUrl}
                  onChange={setImageUrl}
                />
                <Input
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  label={t('adminNews.linkUrl')}
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  placeholder="https://…"
                />
                <Input
                  label={t('adminNews.linkLabel')}
                  value={linkLabel}
                  onChange={(event) => setLinkLabel(event.target.value)}
                  placeholder={t('adminNews.readMore')}
                />
                <Dialog.Actions>
                  <Dialog.Close>{t('adminNews.cancel')}</Dialog.Close>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy || !headline.trim() || !summary.trim()}
                    onClick={() => {
                      setBusy(true);
                      void createNewsPost({
                        headline: headline.trim(),
                        summary: summary.trim(),
                        imageUrl: imageUrl.trim() || undefined,
                        linkUrl: linkUrl.trim() || undefined,
                        linkLabel: linkLabel.trim() || undefined,
                        publish: false,
                      }).then((r) => {
                        setBusy(false);
                        if (!r.ok) {
                          setMsg(r.error);
                          return;
                        }
                        closeCompose();
                        reload();
                      });
                    }}
                  >
                    {t('adminNews.saveAsDraft')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={busy || !headline.trim() || !summary.trim()}
                  >
                    {busy ? 'Publishing…' : 'Publish'}
                  </Button>
                </Dialog.Actions>
              </form>
            </Dialog.Root>
            <ConfirmDialog
              destructive
              isOpen={pendingDeletePost !== null}
              title={
                pendingDeletePost
                  ? t('adminNews.deleteTitleNamed', {
                      headline: pendingDeletePost.headline,
                    })
                  : t('adminNews.deleteTitle')
              }
              description={t('adminNews.deleteDescription')}
              confirmLabel={t('actions.delete')}
              onCancel={() => setPendingDeletePost(null)}
              onConfirm={() => {
                const post = pendingDeletePost;
                setPendingDeletePost(null);
                if (!post) {
                  return;
                }
                void deleteNewsPost(post.id).then((result) => {
                  if (!result.ok) {
                    setMsg(result.error);
                    return;
                  }
                  reload();
                });
              }}
            />
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
