import {
  CheckIcon,
  SettingsIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  EditIconButton,
  ImageReveal,
  InlineError,
  Tooltip,
} from '@tahti-player/ui';

import { type AdminAddon } from '../../../api/admin';
import { statusColor } from './shared';

export function AddonCard({
  addon,
  pending,
  onApprove,
  onReject,
  onManage,
  onPublish,
  onEdit,
  onDelete,
}: {
  addon: AdminAddon;
  pending: boolean;
  onApprove: (addon: AdminAddon) => void;
  onReject: (addon: AdminAddon) => void;
  onManage: (addon: AdminAddon) => void;
  onPublish: (addon: AdminAddon) => void;
  onEdit: (addon: AdminAddon) => void;
  onDelete: (addon: AdminAddon) => void;
}) {
  const { t } = useTranslation('web');
  return (
    <article className="border-border bg-background-secondary/40 flex min-w-0 flex-wrap gap-4 rounded-xl border p-4">
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
      <div className="min-w-0 flex-1 basis-44">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold">{addon.name}</h2>
          <Badge variant="pill" color={statusColor(addon.status)}>
            {addon.status}
          </Badge>
          {addon.status === 'APPROVED' && addon.enabledByDefault && (
            <Badge variant="pill" color="cyan">
              {t('addonCardText.defaultOn')}
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
          <InlineError textSize="xs" className="mt-2" announce={false}>
            {addon.moderationNote}
          </InlineError>
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
      <div className="ml-auto flex shrink-0 items-start gap-1">
        <EditIconButton
          type="button"
          variant="text"
          label={t('addonCardLabels.editName', { name: addon.name })}
          disabled={pending}
          onClick={() => onEdit(addon)}
        />
        <Tooltip
          content={t('addonCardLabels.publishAVersionOfName', {
            name: addon.name,
          })}
          side="top"
        >
          <Button
            type="button"
            size="icon-sm"
            variant="text"
            aria-label={t('addonCardLabels.publishAVersionOfName', {
              name: addon.name,
            })}
            disabled={pending}
            onClick={() => onPublish(addon)}
          >
            <UploadIcon size={16} aria-hidden />
          </Button>
        </Tooltip>
        {addon.status === 'PENDING' && (
          <>
            <Tooltip
              content={t('addonCardLabels.approveNameTheAuthorIs', {
                name: addon.name,
              })}
              side="top"
            >
              <Button
                type="button"
                size="icon-sm"
                variant="text"
                aria-label={t('addonCardLabels.approveName', {
                  name: addon.name,
                })}
                disabled={pending}
                onClick={() => onApprove(addon)}
              >
                <CheckIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip
              content={t('addonCardLabels.rejectName', { name: addon.name })}
              side="top"
            >
              <Button
                type="button"
                size="icon-sm"
                variant="text"
                aria-label={t('addonCardLabels.rejectName', {
                  name: addon.name,
                })}
                disabled={pending}
                onClick={() => onReject(addon)}
              >
                <XIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
          </>
        )}
        {addon.status === 'APPROVED' && (
          <Tooltip
            content={t('addonCardLabels.manageName', { name: addon.name })}
            side="top"
          >
            <Button
              type="button"
              size="icon-sm"
              variant="text"
              aria-label={t('addonCardLabels.manageName', { name: addon.name })}
              onClick={() => onManage(addon)}
            >
              <SettingsIcon size={16} aria-hidden />
            </Button>
          </Tooltip>
        )}
        <Tooltip
          content={t('addonCardLabels.deleteName', { name: addon.name })}
          side="top"
        >
          <Button
            type="button"
            size="icon-sm"
            variant="text"
            aria-label={t('addonCardLabels.deleteName', { name: addon.name })}
            disabled={pending}
            onClick={() => onDelete(addon)}
          >
            <Trash2Icon
              className="text-accent-red-strong"
              size={16}
              aria-hidden
            />
          </Button>
        </Tooltip>
      </div>
    </article>
  );
}
