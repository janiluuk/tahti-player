import { EyeIcon, PlusIcon, SendIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { i18n } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  EditIconButton,
  StoryCard,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import { POST_CATEGORY_LABELS } from '../../api/community-stories';
import {
  deleteArtistPost,
  deleteNewsletterDraft,
  fetchArtistPosts,
  fetchNewsletterDrafts,
  isScheduledPost,
  sendNewsletterDraft,
  type ArtistPost,
  type NewsletterDraft,
} from '../../api/studio-extras';
import { artistPostStory } from '../../components/ArtistStoryFeed';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ImageLightbox } from '../../components/ImageLightbox';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
} from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { newsletterDeliverySummary } from '../../lib/newsletterDelivery';
import { storyDate } from '../../lib/storyDate';
import { useAuthStore } from '../../stores/authStore';
import { NewDraftDialog } from './updates/NewDraftDialog';
import { NewsletterSubscriberStats } from './updates/NewsletterSubscriberStats';
import { PostDialog } from './updates/PostDialog';
import { PostPreview } from './updates/PostPreview';

export type StudioUpdatesTab = 'posts' | 'newsletter';

export function StudioUpdatesView({
  tab = 'posts',
}: {
  tab?: StudioUpdatesTab;
}) {
  const [posts, setPosts] = useState<ArtistPost[]>([]);
  const [drafts, setDrafts] = useState<NewsletterDraft[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const [postEditor, setPostEditor] = useState<{ post?: ArtistPost } | null>(
    null,
  );
  const [draftOpen, setDraftOpen] = useState(false);
  const [previewPost, setPreviewPost] = useState<ArtistPost | null>(null);
  const [lightbox, setLightbox] = useState<{
    images: string[];
    index: number;
  } | null>(null);
  const [pendingDeletePost, setPendingDeletePost] = useState<ArtistPost | null>(
    null,
  );
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [pendingSend, setPendingSend] = useState<NewsletterDraft | null>(null);
  const [pendingDeleteDraft, setPendingDeleteDraft] =
    useState<NewsletterDraft | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const user = useAuthStore((s) => s.user);

  const isEmpty = posts.length === 0 && drafts.length === 0;
  const storyAuthor = {
    username: user?.username ?? 'artist',
    displayName: user?.displayName || user?.username || 'Artist',
    avatarUrl: user?.avatarUrl ?? null,
  };

  const reload = () => {
    setLoadError(null);
    void Promise.all([fetchArtistPosts(), fetchNewsletterDrafts()])
      .then(([p, n]) => {
        const reasons = [p.meta, n.meta]
          .filter((meta) => meta.source === 'api' && meta.reason)
          .map((meta) => meta.reason!);
        setPosts(p.data);
        setDrafts(n.data);
        setLoadError(reasons[0] ?? null);
        if (reasons[0]) {
          toast.error(i18n.t('web:toasts.couldNotLoadPosts'));
        }
      })
      .catch((err) => {
        setLoadError(
          err instanceof Error
            ? err.message
            : i18n.t('web:toasts.couldNotLoadPosts'),
        );
        toast.error(i18n.t('web:toasts.couldNotLoadPosts'));
      })
      .finally(() => setLoaded(true));
  };

  useEffect(() => {
    reload();
  }, []);

  const sendDraft = async (draft: NewsletterDraft) => {
    setSendingId(draft.id);
    try {
      const r = await sendNewsletterDraft(
        draft.id,
        draft.subscribersOnly ? 'fans' : 'all',
      );
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(
        r.queued != null
          ? `Queued send to ${r.queued} subscribers.`
          : 'Send queued.',
      );
      reload();
    } catch {
      toast.error(i18n.t('web:toasts.couldNotSendNewsletter'));
    } finally {
      setSendingId(null);
    }
  };

  return (
    <StudioGate>
      <div
        className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-6 px-1 py-2"
        data-testid="studio-page-layout"
      >
        {loaded && loadError && isEmpty ? (
          <PageError
            title="Could not load posts and newsletters"
            description={loadError}
            onRetry={reload}
          />
        ) : null}
        {loaded && loadError && !isEmpty ? (
          <PageErrorBanner
            title="Could not refresh posts and newsletters"
            description={loadError}
            onRetry={reload}
          />
        ) : null}
        <ViewShell
          title={tab === 'newsletter' ? 'Newsletter' : 'Posts'}
          classes={{ root: 'px-0 pt-0' }}
          actions={
            tab === 'posts' ? (
              <Tooltip content="New post" side="top">
                <Button
                  size="icon-sm"
                  onClick={() => {
                    setMsg(null);
                    setPostEditor({});
                  }}
                  aria-label="New post"
                >
                  <PlusIcon size={16} aria-hidden />
                </Button>
              </Tooltip>
            ) : (
              <Tooltip content="New draft" side="top">
                <Button
                  size="icon-sm"
                  onClick={() => {
                    setMsg(null);
                    setDraftOpen(true);
                  }}
                  aria-label="New draft"
                >
                  <PlusIcon size={16} aria-hidden />
                </Button>
              </Tooltip>
            )
          }
        >
          {msg && (
            <p className="text-foreground-secondary text-sm" role="status">
              {msg}
            </p>
          )}

          {tab === 'posts' && (
            <StudioPanel>
              {posts.length === 0 ? (
                <PageEmpty
                  title="No posts yet"
                  description={
                    isEmpty
                      ? 'Share news, show notes, or tour dates with your followers.'
                      : undefined
                  }
                  action={
                    isEmpty ? (
                      <Button
                        variant="secondary"
                        onClick={() => setPostEditor({})}
                      >
                        <PlusIcon size={16} aria-hidden className="mr-1.5" />
                        Write a post
                      </Button>
                    ) : (
                      <Tooltip content="New post" side="top">
                        <Button
                          size="icon-sm"
                          variant="secondary"
                          onClick={() => setPostEditor({})}
                          aria-label="New post"
                        >
                          <PlusIcon size={16} aria-hidden />
                        </Button>
                      </Tooltip>
                    )
                  }
                />
              ) : (
                <ul
                  className="grid gap-4 sm:grid-cols-2"
                  data-testid="studio-posts-story-grid"
                >
                  {posts.map((p, index) => {
                    const story = artistPostStory(p, storyAuthor);
                    const postTitle = p.title || 'Untitled';
                    const kind = isScheduledPost(p)
                      ? 'Scheduled'
                      : (POST_CATEGORY_LABELS[story.category] ?? 'Story');
                    return (
                      <li
                        key={p.id}
                        className="flex flex-col gap-2"
                        data-testid="studio-post-story"
                      >
                        <StoryCard
                          index={index}
                          imageSrc={story.imageUrl}
                          kind={kind}
                          date={storyDate(p.publishAt)}
                          dateTime={p.publishAt}
                          title={story.title ?? story.excerpt}
                          excerpt={story.title ? story.excerpt : undefined}
                          authorName={
                            storyAuthor.displayName || storyAuthor.username
                          }
                          authorAvatarSrc={storyAuthor.avatarUrl}
                          onOpen={() => setPreviewPost(p)}
                          openLabel={`Preview ${postTitle}`}
                        />
                        <div className="flex shrink-0 gap-1">
                          <Button
                            size="sm"
                            variant="text"
                            aria-label={`Preview ${postTitle}`}
                            onClick={() => setPreviewPost(p)}
                          >
                            <EyeIcon size={15} aria-hidden className="mr-1.5" />
                            Preview
                          </Button>
                          <EditIconButton
                            variant="text"
                            label={`Edit ${postTitle}`}
                            onClick={() => setPostEditor({ post: p })}
                          />
                          <Tooltip content={`Delete ${postTitle}`} side="top">
                            <Button
                              size="icon-sm"
                              variant="text"
                              aria-label={`Delete ${postTitle}`}
                              onClick={() => setPendingDeletePost(p)}
                            >
                              <Trash2Icon size={16} aria-hidden />
                            </Button>
                          </Tooltip>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </StudioPanel>
          )}

          {tab === 'newsletter' && <NewsletterSubscriberStats />}

          {tab === 'newsletter' && (
            <StudioPanel>
              {drafts.length === 0 ? (
                <PageEmpty
                  title="No drafts yet"
                  description={
                    isEmpty
                      ? 'Draft a newsletter or post when you are ready to publish.'
                      : undefined
                  }
                  action={
                    isEmpty ? (
                      <Button onClick={() => setDraftOpen(true)}>
                        <PlusIcon size={16} aria-hidden className="mr-1.5" />
                        New draft
                      </Button>
                    ) : (
                      <Tooltip content="New draft" side="top">
                        <Button
                          size="icon-sm"
                          variant="secondary"
                          onClick={() => setDraftOpen(true)}
                          aria-label="New draft"
                        >
                          <PlusIcon size={16} aria-hidden />
                        </Button>
                      </Tooltip>
                    )
                  }
                />
              ) : (
                <ul className="divide-border divide-y">
                  {drafts.map((d) => (
                    <li
                      key={d.id}
                      className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{d.subject}</div>
                        {d.bodyMd && (
                          <p className="text-foreground-secondary mt-1 whitespace-pre-wrap">
                            {d.bodyMd}
                          </p>
                        )}
                        <p className="text-foreground-secondary mt-1 text-xs">
                          {d.subscribersOnly ? 'Fans only' : 'All subscribers'}
                          {d.state ? `, ${d.state}` : ''}
                          {d.sentAt
                            ? `, sent ${new Date(d.sentAt).toLocaleString()}`
                            : ', draft'}
                        </p>
                        {newsletterDeliverySummary(d.delivery) ? (
                          <p className="text-foreground-secondary mt-0.5 text-xs">
                            {newsletterDeliverySummary(d.delivery)}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {(!d.state || d.state === 'DRAFT') && !d.sentAt && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={sendingId !== null}
                            onClick={() => setPendingSend(d)}
                          >
                            <SendIcon
                              size={16}
                              aria-hidden
                              className="mr-1.5"
                            />
                            Send
                          </Button>
                        )}
                        {d.state !== 'QUEUED' && (
                          <Tooltip content={`Remove ${d.subject}`} side="top">
                            <Button
                              size="icon-sm"
                              variant="text"
                              aria-label={`Remove ${d.subject}`}
                              onClick={() => setPendingDeleteDraft(d)}
                            >
                              <Trash2Icon size={16} aria-hidden />
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </StudioPanel>
          )}
        </ViewShell>

        {postEditor && (
          <PostDialog
            post={postEditor.post}
            onClose={() => setPostEditor(null)}
            onSaved={reload}
            onImageClick={(imageUrl) =>
              setLightbox({ images: [imageUrl], index: 0 })
            }
          />
        )}

        <Dialog.Root
          isOpen={previewPost !== null}
          onClose={() => setPreviewPost(null)}
        >
          <Dialog.Title>Post preview</Dialog.Title>
          {previewPost && (
            <div className="mt-4">
              <PostPreview
                title={previewPost.title}
                body={previewPost.body}
                publishAt={previewPost.publishAt}
                linkUrl={previewPost.linkUrl}
                linkLabel={previewPost.linkLabel}
                images={previewPost.images}
                onImageClick={(index) =>
                  setLightbox({ images: previewPost.images, index })
                }
              />
            </div>
          )}
          <Dialog.Actions>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Actions>
        </Dialog.Root>

        {lightbox && (
          <ImageLightbox
            images={lightbox.images.map((image) => ({ imageUrl: image }))}
            index={lightbox.index}
            label="Post image viewer"
            onIndexChange={(index) => setLightbox({ ...lightbox, index })}
            onClose={() => setLightbox(null)}
          />
        )}

        {draftOpen && (
          <NewDraftDialog
            onClose={() => setDraftOpen(false)}
            onSaved={reload}
          />
        )}

        <ConfirmDialog
          isOpen={pendingSend !== null}
          title={`Send “${pendingSend?.subject ?? 'this newsletter'}”?`}
          description={
            pendingSend?.subscribersOnly
              ? 'This emails all of your fan subscribers now. It cannot be undone.'
              : 'This emails all of your subscribers now. It cannot be undone.'
          }
          confirmLabel="Send newsletter"
          destructive
          onCancel={() => setPendingSend(null)}
          onConfirm={() => {
            const draft = pendingSend;
            setPendingSend(null);
            if (draft) {
              void sendDraft(draft);
            }
          }}
        />

        <ConfirmDialog
          isOpen={pendingDeletePost !== null}
          title={
            pendingDeletePost
              ? `Delete “${pendingDeletePost.title || 'Untitled'}”?`
              : 'Delete post?'
          }
          description="This cannot be undone."
          confirmLabel="Delete"
          destructive
          onCancel={() => setPendingDeletePost(null)}
          onConfirm={() => {
            const post = pendingDeletePost;
            setPendingDeletePost(null);
            if (!post) {
              return;
            }
            void deleteArtistPost(post.id)
              .then((result) => {
                if (!result.ok) {
                  setMsg(result.error);
                  toast.error(result.error);
                  return;
                }
                setPosts((current) =>
                  current.filter((entry) => entry.id !== post.id),
                );
                toast.success(i18n.t('web:toasts.postDeleted'));
              })
              .catch(() =>
                toast.error(i18n.t('web:toasts.couldNotDeletePost')),
              );
          }}
        />

        <ConfirmDialog
          isOpen={pendingDeleteDraft !== null}
          title={
            pendingDeleteDraft
              ? `Remove “${pendingDeleteDraft.subject}”?`
              : 'Remove newsletter?'
          }
          description="This removes the draft or past send from your list. It cannot be undone."
          confirmLabel="Remove"
          destructive
          onCancel={() => setPendingDeleteDraft(null)}
          onConfirm={() => {
            const draft = pendingDeleteDraft;
            setPendingDeleteDraft(null);
            if (!draft) {
              return;
            }
            void deleteNewsletterDraft(draft.id)
              .then((result) => {
                if (!result.ok) {
                  setMsg(result.error);
                  toast.error(result.error);
                  return;
                }
                setDrafts((current) =>
                  current.filter((entry) => entry.id !== draft.id),
                );
                toast.success(i18n.t('web:toasts.newsletterRemoved'));
              })
              .catch(() =>
                toast.error(i18n.t('web:toasts.couldNotRemoveNewsletter')),
              );
          }}
        />
      </div>
    </StudioGate>
  );
}
