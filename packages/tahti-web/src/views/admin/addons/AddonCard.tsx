import { CheckIcon, SettingsIcon, XIcon } from 'lucide-react';

import { Badge, Button, ImageReveal, Tooltip } from '@tahti-player/ui';

import { type AdminAddon } from '../../../api/admin';
import { statusColor } from './shared';

export function AddonCard({
  addon,
  pending,
  onApprove,
  onReject,
  onManage,
}: {
  addon: AdminAddon;
  pending: boolean;
  onApprove: (addon: AdminAddon) => void;
  onReject: (addon: AdminAddon) => void;
  onManage: (addon: AdminAddon) => void;
}) {
  return (
    <article className="border-border bg-background-secondary/40 flex gap-4 rounded-xl border p-4">
      <div className="border-border bg-background flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
        <ImageReveal
          src={addon.iconUrl ?? undefined}
          alt=""
          className="size-full"
          placeholder={
            <span className="text-foreground-secondary text-lg font-bold">
              {addon.name.slice(0, 2).toUpperCase()}
            </span>
          }
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold">{addon.name}</h2>
          <Badge variant="pill" color={statusColor(addon.status)}>
            {addon.status}
          </Badge>
          {addon.status === 'APPROVED' && addon.enabledByDefault && (
            <Badge variant="pill" color="cyan">
              Default on
            </Badge>
          )}
        </div>
        <p className="text-foreground-secondary mt-1 text-xs">
          {addon.scope} · v{addon.currentVersion} · {addon.slug}
        </p>
        <p className="text-foreground-secondary mt-2 text-sm">
          {addon.description}
        </p>
        {addon.moderationNote &&
        (addon.status === 'REJECTED' || addon.status === 'DISABLED') ? (
          <p className="text-accent-red mt-2 text-xs">{addon.moderationNote}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {addon.categories.map((category) => (
            <Badge key={category} variant="pill" color="blue">
              {category}
            </Badge>
          ))}
          <span className="text-foreground-secondary text-xs">
            by {addon.authorName}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-start gap-1">
        {addon.status === 'PENDING' && (
          <>
            <Tooltip content={`Approve ${addon.name}`} side="top">
              <Button
                type="button"
                size="icon-sm"
                variant="text"
                aria-label={`Approve ${addon.name}`}
                disabled={pending}
                onClick={() => onApprove(addon)}
              >
                <CheckIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip content={`Reject ${addon.name}`} side="top">
              <Button
                type="button"
                size="icon-sm"
                variant="text"
                aria-label={`Reject ${addon.name}`}
                disabled={pending}
                onClick={() => onReject(addon)}
              >
                <XIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
          </>
        )}
        {addon.status === 'APPROVED' && (
          <Tooltip content={`Manage ${addon.name}`} side="top">
            <Button
              type="button"
              size="icon-sm"
              variant="text"
              aria-label={`Manage ${addon.name}`}
              onClick={() => onManage(addon)}
            >
              <SettingsIcon size={16} aria-hidden />
            </Button>
          </Tooltip>
        )}
      </div>
    </article>
  );
}
