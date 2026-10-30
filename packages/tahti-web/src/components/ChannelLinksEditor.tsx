import { EyeIcon, EyeOffIcon, PlusIcon, Trash2Icon } from 'lucide-react';

import { Button, InlineError, Input, Tooltip } from '@tahti-player/ui';

import type { ChannelLink } from '../api/channel-design';
import { isSafeChannelLinkUrl } from '../lib/safeHref';
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

  const toggleHidden = (index: number) => {
    onChange(
      rows.map((l, i) => (i === index ? { ...l, hidden: !l.hidden } : l)),
    );
  };

  const removeLink = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const addLink = () => {
    onChange([...rows, { label: '', url: '' }]);
  };

  return (
    <div className="flex flex-col gap-2">
      {rows.map((link, i) => {
        const hidden = Boolean(link.hidden);
        const urlInvalid = !isSafeChannelLinkUrl(link.url);
        return (
          <div
            key={i}
            className={`flex flex-col gap-1 ${hidden ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-foreground-secondary flex size-7 shrink-0 items-center justify-center">
                <SocialLinkIcon label={link.label} url={link.url} />
              </span>
              <Input
                aria-label={`Link ${i + 1} label`}
                size="sm"
                placeholder="Label (e.g. Bandcamp)"
                value={link.label}
                maxLength={40}
                onChange={(e) => updateLink(i, 'label', e.target.value)}
                className="min-w-0 flex-[0.8]"
              />
              <Input
                aria-label={`Link ${i + 1} URL`}
                size="sm"
                type="text"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="https://…"
                value={link.url}
                maxLength={2000}
                aria-invalid={urlInvalid || undefined}
                onChange={(e) => updateLink(i, 'url', e.target.value)}
                className={`min-w-0 flex-1 ${urlInvalid ? 'border-accent-red-strong' : ''}`}
              />
              <Tooltip
                content={hidden ? 'Show on channel' : 'Hide from channel'}
                side="top"
              >
                <Button
                  type="button"
                  size="icon-sm"
                  variant="text"
                  aria-label={
                    hidden ? 'Show link on channel' : 'Hide link from channel'
                  }
                  aria-pressed={hidden}
                  onClick={() => toggleHidden(i)}
                >
                  {hidden ? (
                    <EyeOffIcon size={14} aria-hidden />
                  ) : (
                    <EyeIcon size={14} aria-hidden />
                  )}
                </Button>
              </Tooltip>
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
            {urlInvalid ? (
              <InlineError textSize="xs" className="pl-8">
                Use an http(s) or mailto: link
              </InlineError>
            ) : null}
          </div>
        );
      })}
      <Button type="button" size="sm" variant="secondary" onClick={addLink}>
        <span className="inline-flex items-center gap-1.5">
          <PlusIcon size={14} />
          Add link
        </span>
      </Button>
    </div>
  );
}
