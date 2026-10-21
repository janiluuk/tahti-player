import { ExternalLinkIcon, RotateCcwIcon, Trash2Icon } from 'lucide-react';

import { Badge, Button, ButtonAnchor } from '@tahti-player/ui';

import {
  deleteMyTheme,
  submitThemeForReview,
  themeSubmissionStatus,
  type MyTheme,
} from '../api/me-themes';

function statusColor(theme: MyTheme): 'green' | 'yellow' | 'red' | 'secondary' {
  if (theme.visibility === 'REJECTED') {
    return 'red';
  }
  if (theme.visibility === 'PENDING_REVIEW') {
    return theme.prStatus === 'NONE' ? 'yellow' : 'green';
  }
  return 'secondary';
}

export function ThemeSubmissions({
  themes,
  onChanged,
  onError,
}: {
  themes: MyTheme[];
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  if (themes.length === 0) {
    return null;
  }

  const run = (
    action: Promise<{ ok: true } | { ok: false; error: string }>,
  ) => {
    void action.then((result) => {
      if (!result.ok) {
        onError(result.error);
        return;
      }
      onChanged();
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-foreground-secondary text-xs uppercase">
        Your community submissions
      </h3>
      <ul className="divide-border border-border divide-y rounded-lg border">
        {themes.map((theme) => (
          <li
            key={theme.id}
            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 font-medium">
                {theme.name}
                <Badge variant="pill" color={statusColor(theme)}>
                  {themeSubmissionStatus(theme)}
                </Badge>
              </div>
              {theme.visibility === 'REJECTED' && theme.moderationNote ? (
                <p className="text-foreground-secondary text-xs">
                  Reviewer's note: {theme.moderationNote}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              {theme.prUrl ? (
                <ButtonAnchor
                  href={theme.prUrl}
                  target="_blank"
                  rel="noreferrer"
                  size="sm"
                  variant="text"
                >
                  <ExternalLinkIcon size={14} aria-hidden className="mr-1.5" />
                  Pull request
                </ButtonAnchor>
              ) : null}
              {theme.visibility === 'REJECTED' ||
              theme.visibility === 'PRIVATE' ? (
                <Button
                  size="sm"
                  variant="text"
                  onClick={() => run(submitThemeForReview(theme.id))}
                >
                  <RotateCcwIcon size={14} aria-hidden className="mr-1.5" />
                  Submit again
                </Button>
              ) : null}
              {theme.visibility !== 'PENDING_REVIEW' ? (
                <Button
                  size="icon-sm"
                  variant="text"
                  aria-label={`Delete the ${theme.name} submission`}
                  onClick={() => run(deleteMyTheme(theme.id))}
                >
                  <Trash2Icon size={14} aria-hidden />
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
