import {
  CodeIcon,
  FacebookIcon,
  LinkedinIcon,
  ListMusicIcon,
  MailIcon,
  Share2Icon,
  TwitterIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, CopyButton, Dialog, Tooltip } from '@tahti-player/ui';

import { fetchChannel } from '../api/client';
import { useChannelShareStore } from '../stores/channelShareStore';

export function ChannelShareButton({
  channelSlug,
  displayName,
  iconOnly = true,
}: {
  channelSlug: string;
  displayName: string;
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
  const enabled = useChannelShareStore(
    (state) => state.enabledByChannel[channelSlug] !== false,
  );
  const url = `${window.location.origin}/channel/${channelSlug}`;
  const embedUrl = `${window.location.origin}/embed/c/${channelSlug}`;
  const embedSnippet = `<iframe src="${embedUrl}" width="100%" height="180" frameborder="0" allow="autoplay"></iframe>`;
  const text = `Listen to ${displayName} on Tahti`;

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    void fetchChannel(channelSlug).then(({ playable }) => {
      if (!cancelled) {
        setPlaylistUrl(playable?.streamUrl ?? null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, channelSlug]);

  const socialLinks = [
    {
      id: 'twitter',
      label: 'Share on X',
      icon: TwitterIcon,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    },
    {
      id: 'facebook',
      label: 'Share on Facebook',
      icon: FacebookIcon,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      id: 'linkedin',
      label: 'Share on LinkedIn',
      icon: LinkedinIcon,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      id: 'email',
      label: 'Share by email',
      icon: MailIcon,
      href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
    },
  ];

  if (!enabled) {
    return null;
  }

  return (
    <>
      <Button
        size={iconOnly ? 'icon-sm' : 'sm'}
        variant="secondary"
        onClick={() => setOpen(true)}
        aria-label={`Share ${displayName}`}
        title="Share or embed channel"
      >
        <Share2Icon size={16} aria-hidden />
        {!iconOnly && <span className="ml-1.5">Share</span>}
      </Button>
      <Dialog.Root isOpen={open} onClose={() => setOpen(false)}>
        <Dialog.Title>Share channel</Dialog.Title>
        <div className="mt-4 flex flex-col gap-5">
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Share2Icon size={16} aria-hidden />
              <h3 className="text-sm font-bold">Share</h3>
            </div>
            <p className="text-foreground-secondary text-sm">{text}</p>
            <div className="flex items-center gap-2">
              <code className="border-border bg-background-secondary min-w-0 flex-1 overflow-x-auto rounded-md border px-3 py-2 text-sm whitespace-nowrap">
                {url}
              </code>
              <CopyButton
                text={url}
                aria-label="Copy channel link"
                toastMessage="Link copied."
              />
            </div>
            <div className="flex items-center gap-2">
              <code className="border-border bg-background-secondary min-w-0 flex-1 overflow-x-auto rounded-md border px-3 py-2 text-sm whitespace-nowrap">
                {text}
              </code>
              <CopyButton
                text={text}
                aria-label="Copy share message"
                toastMessage="Message copied."
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <ListMusicIcon size={16} aria-hidden />
                Playlist
              </span>
              <CopyButton
                text={playlistUrl ?? ''}
                disabled={!playlistUrl}
                aria-label="Copy playlist link"
                toastMessage="Playlist link copied."
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              {socialLinks.map((link) => (
                <Tooltip key={link.id} content={link.label} side="top">
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.label}
                    className="border-border hover:bg-background-secondary text-foreground-secondary hover:text-foreground inline-flex size-8 items-center justify-center rounded-lg border transition-colors"
                  >
                    <link.icon size={16} aria-hidden />
                  </a>
                </Tooltip>
              ))}
            </div>
          </section>
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <CodeIcon size={16} aria-hidden />
              <h3 className="text-sm font-bold">Embed</h3>
            </div>
            <div className="flex items-center gap-2">
              <code className="border-border bg-background-secondary min-w-0 flex-1 overflow-x-auto rounded-md border px-3 py-2 text-sm whitespace-nowrap">
                {embedUrl}
              </code>
              <CopyButton
                text={embedUrl}
                aria-label="Copy embed link"
                toastMessage="Link copied."
              />
            </div>
            <div className="flex items-center gap-2">
              <code className="border-border bg-background-secondary min-w-0 flex-1 overflow-x-auto rounded-md border px-3 py-2 text-xs whitespace-nowrap">
                {embedSnippet}
              </code>
              <CopyButton
                text={embedSnippet}
                aria-label="Copy iframe code"
                toastMessage="Embed code copied."
              />
            </div>
          </section>
        </div>
        <Dialog.Actions>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
}
