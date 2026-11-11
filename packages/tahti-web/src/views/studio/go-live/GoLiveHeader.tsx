import {
  CircleHelpIcon,
  RadioIcon,
  Share2Icon,
  SquareIcon,
} from 'lucide-react';
import { useId } from 'react';
import { toast } from 'sonner';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import { Button, Tooltip } from '@tahti-player/ui';

import { cn } from '../../../lib/cn';
import { dateLocaleTag } from '../../../lib/locale';
import { GoLiveStatusChip, type GoLiveStatus } from './GoLiveStatusChip';
import type { GoLiveStepId } from './goLiveSteps';

const ICON_BUTTON =
  'text-foreground hover:bg-background-secondary focus-visible:outline-focus-ring size-11 justify-center rounded-full focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2';

const ACTION_BUTTON =
  'focus-visible:outline-focus-ring min-h-11 gap-2 px-4 font-semibold focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2';

/** Why Start broadcast is unavailable, e.g. "Add a show name and connect
 * your encoder to start." */
export function startBlockedReason(
  t: TFunction<'web'>,
  missing: GoLiveStepId[],
  usageBlocked: boolean,
): string | null {
  if (missing.length > 0) {
    const names = missing.map((step) => t(`goLivePage.missing.${step}`));
    return t('goLivePage.start.missing', {
      steps: new Intl.ListFormat(dateLocaleTag(), {
        type: 'conjunction',
      }).format(names),
    });
  }
  return usageBlocked ? t('goLivePage.start.usageBlocked') : null;
}

export async function copyChannelLink(slug: string): Promise<boolean> {
  const url = `${window.location.origin}/channel/${slug}`;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

export function GoLiveHeader({
  status,
  liveSince,
  reconnectDeadline,
  missing,
  usageBlocked,
  onAir,
  busy,
  slug,
  onStart,
  onEnd,
  onHelp,
}: {
  status: GoLiveStatus;
  liveSince: string | null;
  reconnectDeadline: string | null;
  missing: GoLiveStepId[];
  usageBlocked: boolean;
  onAir: boolean;
  busy: boolean;
  slug: string;
  onStart: () => void;
  onEnd: () => void;
  onHelp: () => void;
}) {
  const { t } = useTranslation('web');
  const reasonId = useId();
  const blockedReason = startBlockedReason(t, missing, usageBlocked);
  const startDisabled = Boolean(blockedReason) || busy;

  const share = async () => {
    if (await copyChannelLink(slug)) {
      toast.success(t('goLivePage.share.copied'));
    } else {
      toast.error(t('goLivePage.share.failed'));
    }
  };

  return (
    <header className="flex w-full flex-wrap items-center gap-x-4 gap-y-3">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold">
          {t('goLive.goLive')}
        </h1>
        <GoLiveStatusChip
          status={status}
          liveSince={liveSince}
          reconnectDeadline={reconnectDeadline}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="plain"
          size="flexible"
          className={ICON_BUTTON}
          aria-label={t('goLivePage.help.open')}
          onClick={onHelp}
        >
          <CircleHelpIcon size={20} aria-hidden />
        </Button>
        {slug ? (
          <Button
            variant="plain"
            size="flexible"
            className={ICON_BUTTON}
            aria-label={t('goLivePage.share.copy')}
            onClick={() => void share()}
          >
            <Share2Icon size={20} aria-hidden />
          </Button>
        ) : null}
        {onAir ? (
          <Button
            variant="plain"
            size="flexible"
            className={cn(
              ACTION_BUTTON,
              'border-border-input text-foreground hover:bg-background-secondary rounded-md border-2 bg-transparent',
            )}
            disabled={busy}
            onClick={onEnd}
          >
            <SquareIcon size={16} aria-hidden />
            {t('goLivePage.end.label')}
          </Button>
        ) : (
          <Tooltip
            content={blockedReason}
            disabled={!blockedReason}
            side="bottom"
            multiline
          >
            <Button
              variant={startDisabled ? 'plain' : 'default'}
              size="flexible"
              aria-disabled={startDisabled || undefined}
              aria-describedby={blockedReason ? reasonId : undefined}
              className={cn(
                ACTION_BUTTON,
                startDisabled &&
                  'border-border-subtle bg-background-input text-foreground-disabled cursor-not-allowed rounded-md border-2 active:scale-100',
              )}
              onClick={() => {
                if (!startDisabled) {
                  onStart();
                }
              }}
            >
              <RadioIcon size={16} aria-hidden />
              {busy ? t('goLivePage.start.busy') : t('goLivePage.start.label')}
            </Button>
            {blockedReason ? (
              <span id={reasonId} className="sr-only">
                {blockedReason}
              </span>
            ) : null}
          </Tooltip>
        )}
      </div>
    </header>
  );
}
