import { ScrollTextIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { i18n, useTranslation } from '@tahti-player/i18n';
import {
  Alert,
  Button,
  ButtonAnchor,
  showNotificationToast,
  toast,
} from '@tahti-player/ui';

import type { TahtiNotification } from '../api/notifications';
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

/** The sticky guidelines notice above Listen. A notice known at first
 * paint (cached for this account) shows inline; one that only arrives once
 * the inbox loads shows as a sticky toast instead, so it never pushes down
 * content that is already on screen. */
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
  const late = sticky != null && !shownAtMount.current ? sticky : null;

  const onAcknowledge = useCallback(
    (id: string) => {
      setRemembered(null);
      if (userId) {
        writeStickyNotice(userId, null);
      }
      void acknowledge(id);
    },
    [userId, acknowledge],
  );

  const lateId = late?.id;
  const lateTitle = late?.title;
  const lateBody = late?.body;
  const lateUrl = late?.url;
  useEffect(() => {
    if (!lateId || !lateTitle) {
      return;
    }
    showNotificationToast(lateTitle, {
      id: lateId,
      description: lateBody ?? i18n.t('web:batch52.reviewGuidelines'),
      sticky: true,
      actionLabel: i18n.t('web:guidelinesBanner.acknowledge'),
      onAction: () => onAcknowledge(lateId),
      link: lateUrl
        ? {
            label: i18n.t('web:guidelinesBanner.readGuidelines'),
            href: lateUrl,
          }
        : undefined,
    });
    return () => {
      toast.dismiss(lateId);
    };
  }, [lateId, lateTitle, lateBody, lateUrl, onAcknowledge]);

  if (!sticky || late) {
    return null;
  }

  return (
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
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onAcknowledge(sticky.id)}
          >
            {t('guidelinesBanner.acknowledge')}
          </Button>
        </div>
      </div>
    </Alert>
  );
}
