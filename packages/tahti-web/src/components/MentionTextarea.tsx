import { useEffect, useState } from 'react';

import { Button, MediaArtwork, Textarea } from '@tahti-player/ui';

import { searchMentionUsers, type MentionUser } from '../api/mentions';
import { placeholderArtworkUrl } from '../lib/placeholderArt';

type Props = {
  label: string;
  value: string;
  rows?: number;
  placeholder?: string;
  onChange: (value: string) => void;
};

export function MentionTextarea({
  label,
  value,
  rows = 4,
  placeholder,
  onChange,
}: Props) {
  const [matches, setMatches] = useState<MentionUser[]>([]);
  const [mentionStart, setMentionStart] = useState<number | null>(null);

  useEffect(() => {
    const match = /(?:^|\s)@([a-z0-9_-]*)$/i.exec(value);
    if (!match || match.index + match[0].length === 0) {
      setMatches([]);
      setMentionStart(null);
      return;
    }
    const start = value.length - match[1].length - 1;
    setMentionStart(start);
    let cancelled = false;
    void searchMentionUsers(match[1]).then((result) => {
      if (!cancelled) {
        setMatches(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [value]);

  const selectMention = (user: MentionUser) => {
    if (mentionStart === null) {
      return;
    }
    onChange(`${value.slice(0, mentionStart)}@${user.username} `);
    setMatches([]);
    setMentionStart(null);
  };

  return (
    <div className="relative flex flex-col gap-1">
      <label className="flex flex-col gap-1 text-sm">
        {label}
        <Textarea
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      {matches.length > 0 ? (
        <ul
          className="border-border bg-background absolute top-full right-0 left-0 z-10 mt-1 overflow-hidden rounded-md border shadow-lg"
          role="listbox"
          aria-label="Mention suggestions"
        >
          {matches.map((user) => (
            <li key={user.username}>
              <Button
                type="button"
                variant="text"
                className="h-auto w-full justify-start gap-2 rounded-none px-3 py-2 text-left text-sm"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectMention(user)}
              >
                <MediaArtwork
                  size="sm"
                  src={user.avatarUrl ?? placeholderArtworkUrl(user.username)}
                  alt=""
                  className="size-7 min-w-7 rounded-full"
                />
                <span className="font-medium">{user.displayName}</span>
                <span className="text-foreground-secondary text-xs">
                  @{user.username}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-foreground-secondary text-xs">
        Type @ followed by at least two characters to tag a Tahti user. Tagged
        users receive a notification when saved.
      </p>
    </div>
  );
}
