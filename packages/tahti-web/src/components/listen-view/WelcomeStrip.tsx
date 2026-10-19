import { ArrowRightIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

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
      <Tooltip content="Hide this introduction" side="left">
        <Button
          size="icon-sm"
          variant="text"
          className="absolute top-3 right-3"
          aria-label="Hide this introduction"
          onClick={dismiss}
        >
          <XIcon size={16} aria-hidden />
        </Button>
      </Tooltip>
      <h2
        id="welcome-strip-title"
        className="font-display text-xl font-bold tracking-tight sm:text-2xl"
      >
        Independent music, live.
      </h2>
      <p className="text-foreground-secondary mt-2 max-w-2xl text-sm leading-relaxed">
        Tahti is nonprofit broadcasting for independent artists — built to
        support artists, not algorithms. Listen to live shows, the 24/7 Tahti
        Radio and new releases from the community, free.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink to="/join" size="sm" className="gap-1.5">
          Join free
          <ArrowRightIcon size={15} aria-hidden />
        </ButtonLink>
        <ButtonLink to="/for-artists" size="sm" variant="secondary">
          Tahti for artists
        </ButtonLink>
        <ButtonLink to="/what-is-it" size="sm" variant="text">
          What is Tahti?
        </ButtonLink>
      </div>
    </section>
  );
}
