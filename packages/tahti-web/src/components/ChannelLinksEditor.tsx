import { PlusIcon, Trash2Icon } from 'lucide-react';

import { Button, Input, Tooltip } from '@tahti-player/ui';

import type { ChannelLink } from '../api/channel-design';
import { SocialLinkIcon } from './SocialLinkIcon';

/** Add/edit/remove outbound links for the channel page's Links block —
 * adapted from tahti-org's channel editor (channel-links-panel.tsx) to this
 * repo's UI kit. Controlled: mutates are reported via onChange so the
 * canvas block re-renders live as the artist types (see ChannelView's
 * 'links' case), and the surrounding designer's own Save button persists
 * the result through patchChannelVisual. */
export function ChannelLinksEditor({
  links,
  onChange,
}: {
  links: ChannelLink[];
  onChange: (links: ChannelLink[]) => void;
}) {
  const rows = links.length > 0 ? links : [{ label: '', url: '' }];

  const updateLink = (index: number, field: 'label' | 'url', value: string) => {
    onChange(rows.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const removeLink = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const addLink = () => {
    onChange([...rows, { label: '', url: '' }]);
  };

  return (
    <div className="flex flex-col gap-2">
      {rows.map((link, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="text-foreground-secondary flex size-7 shrink-0 items-center justify-center">
            <SocialLinkIcon label={link.label} url={link.url} />
          </span>
          <Input
            size="sm"
            placeholder="Label (e.g. Bandcamp)"
            value={link.label}
            maxLength={40}
            onChange={(e) => updateLink(i, 'label', e.target.value)}
            className="min-w-0 flex-[0.8]"
          />
          <Input
            size="sm"
            type="text"
            placeholder="https://…"
            value={link.url}
            maxLength={2000}
            onChange={(e) => updateLink(i, 'url', e.target.value)}
            className="min-w-0 flex-1"
          />
          <Tooltip content="Remove link" side="top">
            <Button
              type="button"
              size="icon-sm"
              variant="text"
              aria-label="Remove link"
              onClick={() => removeLink(i)}
            >
              <Trash2Icon size={14} />
            </Button>
          </Tooltip>
        </div>
      ))}
      <Button type="button" size="sm" variant="secondary" onClick={addLink}>
        <span className="inline-flex items-center gap-1.5">
          <PlusIcon size={14} />
          Add link
        </span>
      </Button>
    </div>
  );
}
