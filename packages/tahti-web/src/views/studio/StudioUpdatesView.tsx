import {
  CalendarClockIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  SendIcon,
  Trash2Icon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  EmptyState,
  ImageReveal,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  deleteArtistPost,
  fetchArtistPosts,
  fetchNewsletterDrafts,
  isScheduledPost,
  sendNewsletterDraft,
  type ArtistPost,
  type NewsletterDraft,
} from '../../api/studio-extras';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ImageLightbox } from '../../components/ImageLightbox';
import { PageError } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { newsletterDeliverySummary } from '../../lib/newsletterDelivery';
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const isEmpty = posts.length === 0 && drafts.length === 0;

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
          toast.error('Could not load posts and newsletters.');
        }
      })
      .catch((err) => {
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Could not load posts and newsletters.',
        );
        toast.error('Could not load posts and newsletters.');
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
      toast.error('Could not send the newsletter.');
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
        <ViewShell
          title="Updates"
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
                <EmptyState
                  size="sm"
                  title="No posts yet"
                  description={
                    isEmpty
                      ? 'Share news, show notes, or tour dates with your followers.'
                      : undefined
                  }
                  action={
                    isEmpty ? (
                      <Button size="sm" onClick={() => setPostEditor({})}>
                        <PlusIcon size={16} aria-hidden className="mr-1.5" />
                        Write a post
                      </Button>
                    ) : (
                      <Tooltip content="New post" side="top">
                        <Button
                          size="icon-sm"
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
                <ul className="divide-border divide-y">
                  {posts.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
                    >
                      <div className="min-w-56 flex-1">
                        <div className="font-medium">
                          {p.title || 'Untitled'}
                        </div>
                        <p className="text-foreground-secondary mt-1 line-clamp-3 whitespace-pre-wrap">
                          {p.body}
                        </p>
                        {p.images.length > 0 && (
                          <div className="mt-2 flex gap-2 overflow-hidden">
                            {p.images.map((image, index) => (
                              <Button
                                key={`${image}-${index}`}
                                type="button"
                                variant="text"
                                className="bg-background-secondary size-16 shrink-0 overflow-hidden rounded-md p-0"
                                onClick={() =>
                                  setLightbox({ images: p.images, index })
                                }
                                aria-label={`View image ${index + 1} full size`}
                              >
                                <ImageReveal
                                  src={image}
                                  alt=""
                                  className="size-full"
                                />
                              </Button>
                            ))}
                          </div>
                        )}
                        {isScheduledPost(p) ? (
                          <p className="text-foreground-secondary mt-1 flex items-center gap-1 text-xs">
                            <CalendarClockIcon size={13} aria-hidden />
                            Scheduled for{' '}
                            {new Date(p.publishAt).toLocaleString()}
                          </p>
                        ) : (
                          <p className="text-foreground-secondary mt-1 text-xs">
                            {new Date(p.publishAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          size="sm"
                          variant="text"
                          onClick={() => setPreviewPost(p)}
                        >
                          <EyeIcon size={15} aria-hidden className="mr-1.5" />
                          Preview
                        </Button>
                        <Tooltip content="Edit" side="top">
                          <Button
                            size="icon-sm"
                            variant="text"
                            aria-label="Edit post"
                            onClick={() => setPostEditor({ post: p })}
                          >
                            <PencilIcon size={16} aria-hidden />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Delete" side="top">
                          <Button
                            size="icon-sm"
                            variant="text"
                            aria-label="Delete post"
                            onClick={() => setPendingDeletePost(p)}
                          >
                            <Trash2Icon size={16} aria-hidden />
                          </Button>
                        </Tooltip>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </StudioPanel>
          )}

          {tab === 'newsletter' && <NewsletterSubscriberStats />}

          {tab === 'newsletter' && (
            <StudioPanel>
              {drafts.length === 0 ? (
                <EmptyState
                  size="sm"
                  title="No drafts yet"
                  description={
                    isEmpty
                      ? 'Draft a newsletter or post when you are ready to publish.'
                      : undefined
                  }
                  action={
                    isEmpty ? (
                      <Button size="sm" onClick={() => setDraftOpen(true)}>
                        <PlusIcon size={16} aria-hidden className="mr-1.5" />
                        New draft
                      </Button>
                    ) : (
                      <Tooltip content="New draft" side="top">
                        <Button
                          size="icon-sm"
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
                      {(!d.state || d.state === 'DRAFT') && !d.sentAt && (
                        <Button
                          size="sm"
                          disabled={sendingId !== null}
                          onClick={() => setPendingSend(d)}
                        >
                          <SendIcon size={16} aria-hidden className="mr-1.5" />
                          Send
                        </Button>
                      )}
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
                toast.success('Post deleted.');
              })
              .catch(() => toast.error('Could not delete the post.'));
          }}
        />
      </div>
    </StudioGate>
  );
}
