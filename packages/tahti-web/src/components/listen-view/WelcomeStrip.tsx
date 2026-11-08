import { ArrowRightIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, ButtonLink, Tooltip } from '@tahti-player/ui';

const DISMISSED_KEY = 'tahti-web-welcome-dismissed';

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

/** First-visit introduction on the front page for signed-out visitors:
 * what Tahti is, and where to go next. Can be hidden for good. */
export function WelcomeStrip() {
  const { t } = useTranslation('web');
  const [dismissed, setDismissed] = useState(readDismissed);
  if (dismissed) {
    return null;
  }
  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // ignore
    }
  };
  return (
    <section
      aria-labelledby="welcome-strip-title"
      data-testid="listen-welcome"
      className="border-border bg-background-secondary/40 relative rounded-[var(--radius-card)] border-(length:--border-width) p-5 pr-12 sm:p-6 sm:pr-14"
    >
      <Tooltip content={t('welcomeStrip.hideThisIntroduction')} side="left">
        <Button
          size="icon-sm"
          variant="text"
          className="absolute top-3 right-3"
          aria-label={t('welcomeStrip.hideThisIntroduction')}
          onClick={dismiss}
        >
          <XIcon size={16} aria-hidden />
        </Button>
      </Tooltip>
      <h2
        id="welcome-strip-title"
        className="font-display text-xl font-bold tracking-tight sm:text-2xl"
      >
        {t('welcomeStrip.independentMusicLive')}
      </h2>
      <p className="text-foreground-secondary mt-2 max-w-2xl text-sm leading-relaxed">
        {t('welcomeStrip.tahtiIsNonprofitBroadcastingFor')}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink to="/join" size="sm" className="gap-1.5">
          {t('welcomeStrip.joinFree')}
          <ArrowRightIcon size={15} aria-hidden />
        </ButtonLink>
        <ButtonLink to="/for-artists" size="sm" variant="secondary">
          {t('welcomeStrip.tahtiForArtists')}
        </ButtonLink>
        <ButtonLink to="/what-is-it" size="sm" variant="text">
          {t('welcomeStrip.whatIsTahti')}
        </ButtonLink>
      </div>
    </section>
  );
}
