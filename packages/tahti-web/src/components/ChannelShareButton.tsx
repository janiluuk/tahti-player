import {
  CodeIcon,
  FacebookIcon,
  LinkedinIcon,
  ListMusicIcon,
  MailIcon,
  RssIcon,
  Share2Icon,
  TwitterIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  CopyButton,
  Dialog,
  ExternalLink,
  Tooltip,
} from '@tahti-player/ui';

import { fetchChannel } from '../api/client';
import { channelRssFeedUrl } from '../lib/channelRssFeed';

export function ChannelShareButton({
  channelSlug,
  displayName,
  iconOnly = true,
  open: openProp,
  onOpenChange,
  showTrigger = true,
}: {
  channelSlug: string;
  displayName: string;
  iconOnly?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}) {
  const { t } = useTranslation('web');
  const shareAction = t('actions.share');
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
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
      label: t('channelShare.shareOnX'),
      icon: TwitterIcon,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    },
    {
      id: 'facebook',
      label: t('channelShare.shareOnFacebook'),
      icon: FacebookIcon,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      id: 'linkedin',
      label: t('channelShare.shareOnLinkedIn'),
      icon: LinkedinIcon,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      id: 'email',
      label: t('channelShare.shareByEmail'),
      icon: MailIcon,
      href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
    },
  ];

  return (
    <>
      {showTrigger ? (
        <Tooltip
          content={t('channelShare.shareOrEmbed')}
          side="bottom"
          wrapperClassName="inline-flex"
        >
          <Button
            size={iconOnly ? 'icon-sm' : 'sm'}
            variant="secondary"
            onClick={() => setOpen(true)}
            aria-label={`${shareAction} ${displayName}`}
          >
            <Share2Icon size={16} aria-hidden />
            {!iconOnly && <span className="ml-1.5">{shareAction}</span>}
          </Button>
        </Tooltip>
      ) : null}
      <Dialog.Root isOpen={open} onClose={() => setOpen(false)}>
        <Dialog.Title>{t('channelShare.title')}</Dialog.Title>
        <div className="mt-4 flex flex-col gap-5">
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Share2Icon size={16} aria-hidden />
              <h3 className="text-sm font-bold">{shareAction}</h3>
            </div>
            <p className="text-foreground-secondary text-sm">{text}</p>
            <div className="flex items-center gap-2">
              <code className="border-border bg-background-secondary min-w-0 flex-1 overflow-x-auto rounded-md border px-3 py-2 text-sm whitespace-nowrap">
                {url}
              </code>
              <CopyButton
                text={url}
                aria-label={t('channelShare.copyLink')}
                toastMessage={t('channelShare.linkCopied')}
              />
            </div>
            <div className="flex items-center gap-2">
              <code className="border-border bg-background-secondary min-w-0 flex-1 overflow-x-auto rounded-md border px-3 py-2 text-sm whitespace-nowrap">
                {text}
              </code>
              <CopyButton
                text={text}
                aria-label={t('channelShare.copyMessage')}
                toastMessage={t('channelShare.messageCopied')}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <ListMusicIcon size={16} aria-hidden />
                {t('channelShare.playlist')}
              </span>
              <CopyButton
                text={playlistUrl ?? ''}
                disabled={!playlistUrl}
                aria-label={t('channelShare.copyPlaylist')}
                toastMessage={t('channelShare.playlistCopied')}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <RssIcon size={16} aria-hidden />
                {t('channelShare.rssFeed')}
              </span>
              <CopyButton
                text={channelRssFeedUrl(channelSlug)}
                aria-label={t('channelShare.copyRss')}
                toastMessage={t('channelShare.feedCopied')}
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              {socialLinks.map((link) => (
                <Tooltip key={link.id} content={link.label} side="top">
                  <ExternalLink
                    href={link.href}
                    aria-label={link.label}
                    className="border-border hover:bg-background-secondary text-foreground-secondary hover:text-foreground inline-flex size-8 items-center justify-center rounded-lg border no-underline transition-colors"
                  >
                    <link.icon size={16} aria-hidden />
                  </ExternalLink>
                </Tooltip>
              ))}
            </div>
          </section>
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <CodeIcon size={16} aria-hidden />
              <h3 className="text-sm font-bold">{t('channelShare.embed')}</h3>
            </div>
            <div className="flex items-center gap-2">
              <code className="border-border bg-background-secondary min-w-0 flex-1 overflow-x-auto rounded-md border px-3 py-2 text-sm whitespace-nowrap">
                {embedUrl}
              </code>
              <CopyButton
                text={embedUrl}
                aria-label={t('channelShare.copyEmbedLink')}
                toastMessage={t('channelShare.linkCopied')}
              />
            </div>
            <div className="flex items-center gap-2">
              <code className="border-border bg-background-secondary min-w-0 flex-1 overflow-x-auto rounded-md border px-3 py-2 text-xs whitespace-nowrap">
                {embedSnippet}
              </code>
              <CopyButton
                text={embedSnippet}
                aria-label={t('channelShare.copyIframe')}
                toastMessage={t('channelShare.embedCopied')}
              />
            </div>
          </section>
        </div>
        <Dialog.Actions>
          <Dialog.Close>{t('actions.close')}</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
}
