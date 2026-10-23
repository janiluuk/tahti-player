import { CodeIcon } from 'lucide-react';
import { useState } from 'react';

import { Button, CopyButton, Dialog, Tooltip } from '@tahti-player/ui';

export type EmbedTarget =
  | { kind: 'channel'; slug: string }
  | { kind: 'release'; id: string }
  | { kind: 'collection'; slug: string };

function embedPath(target: EmbedTarget): string {
  switch (target.kind) {
    case 'channel':
      return `/embed/c/${target.slug}`;
    case 'release':
      return `/embed/r/${target.id}`;
    case 'collection':
      return `/embed/col/${target.slug}`;
  }
}

/**
 * "Embed" action for anything with a public /embed/... view — channels,
 * releases, and collections (playlists are collections under the hood, so
 * this covers them too). Opens the embeddable URL and a copyable iframe
 * snippet; nothing here needs its own API call.
 */
export function EmbedButton({
  target,
  label = 'Embed',
  iconOnly = false,
}: {
  target: EmbedTarget;
  label?: string;
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const url = `${window.location.origin}${embedPath(target)}`;
  const snippet = `<iframe src="${url}" width="100%" height="180" frameborder="0" allow="autoplay"></iframe>`;

  return (
    <>
      <Tooltip
        content="Embed artist channel"
        side="bottom"
        disabled={!iconOnly}
        wrapperClassName="inline-flex"
      >
        <Button
          size={iconOnly ? 'icon-sm' : 'sm'}
          variant="secondary"
          onClick={() => setOpen(true)}
          aria-label={iconOnly ? 'Embed artist channel' : undefined}
        >
          <CodeIcon
            size={14}
            aria-hidden
            className={iconOnly ? undefined : 'mr-1.5'}
          />
          {!iconOnly && label}
        </Button>
      </Tooltip>
      <Dialog.Root isOpen={open} onClose={() => setOpen(false)}>
        <Dialog.Title>Embed</Dialog.Title>
        <Dialog.Description>
          Paste this into any site to embed a live player.
        </Dialog.Description>
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-foreground-secondary text-xs uppercase">
              Link
            </span>
            <div className="flex items-center gap-2">
              <code className="border-border bg-background-secondary flex-1 overflow-x-auto rounded-md border px-3 py-2 text-sm whitespace-nowrap">
                {url}
              </code>
              <CopyButton
                text={url}
                aria-label="Copy embed link"
                toastMessage="Link copied."
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-foreground-secondary text-xs uppercase">
              Iframe code
            </span>
            <div className="flex items-center gap-2">
              <code className="border-border bg-background-secondary flex-1 overflow-x-auto rounded-md border px-3 py-2 text-xs whitespace-nowrap">
                {snippet}
              </code>
              <CopyButton
                text={snippet}
                aria-label="Copy iframe code"
                toastMessage="Embed code copied."
              />
            </div>
          </div>
        </div>
        <Dialog.Actions>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
}
