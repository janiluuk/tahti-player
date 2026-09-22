import {
  EyeIcon,
  NewspaperIcon,
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
  TabLabel,
  Tabs,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  deleteArtistPost,
  fetchArtistPosts,
  fetchNewsletterDrafts,
  sendNewsletterDraft,
  type ArtistPost,
  type NewsletterDraft,
} from '../../api/studio-extras';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ImageLightbox } from '../../components/ImageLightbox';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';
import { NewDraftDialog } from './updates/NewDraftDialog';
import { NewPostDialog } from './updates/NewPostDialog';
import { PostPreview } from './updates/PostPreview';

type Tab = 'posts' | 'newsletter';

export function StudioUpdatesView() {
  const [tab, setTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<ArtistPost[]>([]);
  const [drafts, setDrafts] = useState<NewsletterDraft[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const [postOpen, setPostOpen] = useState(false);
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

  const isEmpty = posts.length === 0 && drafts.length === 0;

  const reload = () => {
    void Promise.all([fetchArtistPosts(), fetchNewsletterDrafts()]).then(
      ([p, n]) => {
        setPosts(p.data);
        setDrafts(n.data);
      },
    );
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
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/updates" />
        <Tabs.Root
          selectedIndex={tab === 'posts' ? 0 : 1}
          onChange={(index) => setTab(index === 0 ? 'posts' : 'newsletter')}
        >
          <Tabs.List>
            <Tabs.Tab>
              <TabLabel icon={<NewspaperIcon size={14} />}>Posts</TabLabel>
            </Tabs.Tab>
            <Tabs.Tab>
              <TabLabel icon={<SendIcon size={14} />}>Newsletter</TabLabel>
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
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
                    setPostOpen(true);
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
                  action={
                    !isEmpty ? (
                      <Tooltip content="New post" side="top">
                        <Button
                          size="icon-sm"
                          onClick={() => setPostOpen(true)}
                          aria-label="New post"
                        >
                          <PlusIcon size={16} aria-hidden />
                        </Button>
                      </Tooltip>
                    ) : undefined
                  }
                />
              ) : (
                <ul className="divide-border divide-y">
                  {posts.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
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
                        <p className="text-foreground-secondary mt-1 text-xs">
                          {new Date(p.publishAt).toLocaleString()}
                        </p>
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

          {tab === 'newsletter' && (
            <StudioPanel>
              {drafts.length === 0 ? (
                <EmptyState
                  size="sm"
                  title="No drafts yet"
                  action={
                    !isEmpty ? (
                      <Tooltip content="New draft" side="top">
                        <Button
                          size="icon-sm"
                          onClick={() => setDraftOpen(true)}
                          aria-label="New draft"
                        >
                          <PlusIcon size={16} aria-hidden />
                        </Button>
                      </Tooltip>
                    ) : undefined
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

        {postOpen && (
          <NewPostDialog
            onClose={() => setPostOpen(false)}
            onPublished={reload}
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
            void deleteArtistPost(post.id).then((result) => {
              if (!result.ok) {
                setMsg(result.error);
                toast.error(result.error);
                return;
              }
              setPosts((current) =>
                current.filter((entry) => entry.id !== post.id),
              );
              toast.success('Post deleted.');
            });
          }}
        />
      </div>
    </StudioGate>
  );
}
