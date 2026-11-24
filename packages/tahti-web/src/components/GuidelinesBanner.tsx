import { ScrollTextIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Alert, Button, ButtonAnchor } from '@tahti-player/ui';

import type { TahtiNotification } from '../api/notifications';
import { cn } from '../lib/cn';
import { useAuthStore } from '../stores/authStore';
import { useNotificationInboxStore } from '../stores/notificationInboxStore';

export const STICKY_NOTICE_KEY = 'tahti-web-sticky-notice';

type StickyNotice = Pick<TahtiNotification, 'id' | 'title' | 'body' | 'url'>;

type StoredStickyNotice = StickyNotice & { userId: string };

function readStickyNotice(userId: string | undefined): StickyNotice | null {
  if (!userId) {
    return null;
  }
  try {
    const raw = localStorage.getItem(STICKY_NOTICE_KEY);
    const stored = raw ? (JSON.parse(raw) as StoredStickyNotice) : null;
    return stored?.userId === userId && stored.id ? stored : null;
  } catch {
    return null;
  }
}

function writeStickyNotice(userId: string, notice: StickyNotice | null) {
  try {
    if (notice) {
      const stored: StoredStickyNotice = {
        userId,
        id: notice.id,
        title: notice.title,
        body: notice.body,
        url: notice.url,
      };
      localStorage.setItem(STICKY_NOTICE_KEY, JSON.stringify(stored));
    } else {
      localStorage.removeItem(STICKY_NOTICE_KEY);
    }
  } catch {
    return;
  }
}

export function GuidelinesBanner() {
  const userId = useAuthStore((s) => s.user?.id);
  return <UserGuidelinesBanner key={userId ?? 'anonymous'} userId={userId} />;
}

function UserGuidelinesBanner({ userId }: { userId: string | undefined }) {
  const { t } = useTranslation('web');
  const live = useNotificationInboxStore((s) =>
    s.items.find((item) => item.sticky && !item.readAt),
  );
  const loaded = useNotificationInboxStore((s) => s.loaded);
  const acknowledge = useNotificationInboxStore((s) => s.acknowledge);
  const [remembered, setRemembered] = useState(() => readStickyNotice(userId));

  useEffect(() => {
    if (userId && loaded) {
      writeStickyNotice(userId, live ?? null);
    }
  }, [userId, loaded, live]);

  const sticky = live ?? (loaded ? null : remembered);
  const shownAtMount = useRef(sticky != null);
  const [opened, setOpened] = useState(shownAtMount.current);
  useEffect(() => {
    if (!sticky || opened) {
      return;
    }
    const frame = requestAnimationFrame(() => setOpened(true));
    return () => cancelAnimationFrame(frame);
  }, [sticky, opened]);

  if (!sticky) {
    return null;
  }

  const onAcknowledge = () => {
    setRemembered(null);
    if (userId) {
      writeStickyNotice(userId, null);
    }
    void acknowledge(sticky.id);
  };

  const alert = (
    <Alert
      tone="neutral"
      icon={<ScrollTextIcon size={16} className="text-primary" aria-hidden />}
      title={sticky.title}
      data-testid="guidelines-banner"
      className="mb-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>{sticky.body ?? i18n.t('web:batch52.reviewGuidelines')}</span>
        <div className="flex flex-wrap gap-2">
          {sticky.url ? (
            <ButtonAnchor href={sticky.url} size="sm" variant="secondary">
              {t('guidelinesBanner.readGuidelines')}
            </ButtonAnchor>
          ) : null}
          <Button size="sm" variant="secondary" onClick={onAcknowledge}>
            {t('guidelinesBanner.acknowledge')}
          </Button>
        </div>
      </div>
    </Alert>
  );
  if (shownAtMount.current) {
    return alert;
  }
  return (
    <div
      data-testid="guidelines-banner-reveal"
      data-open={opened || undefined}
      className={cn(
        'grid motion-safe:transition-[grid-template-rows] motion-safe:duration-300 motion-safe:ease-out',
        opened ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
      )}
    >
      <div className="min-h-0 overflow-hidden">{alert}</div>
    </div>
  );
}
