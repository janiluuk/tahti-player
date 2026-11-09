import { UserPlusIcon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Input, MediaArtwork, Select } from '@tahti-player/ui';

import { setEventParticipants } from '../../api/event-calendar';
import type {
  ArtistEvent,
  ArtistEventParticipant,
  ArtistEventRole,
} from '../../api/events';
import { searchMentionUsers, type MentionUser } from '../../api/mentions';

const ROLES: ArtistEventRole[] = ['PERFORMER', 'HOST', 'GUEST'];
const MAX_TAGS = 20;

/** Tag other Tahti accounts on an event. Each new tag is an invite the
 * person accepts before it shows publicly. */
export function EventParticipantsEditor({
  event,
  onSaved,
}: {
  event: ArtistEvent;
  onSaved: (event: ArtistEvent) => void;
}) {
  const { t } = useTranslation('web');
  const [rows, setRows] = useState<ArtistEventParticipant[]>(
    event.participants,
  );
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<MentionUser[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRows(event.participants);
  }, [event.participants]);

  useEffect(() => {
    let cancelled = false;
    void searchMentionUsers(query).then((result) => {
      if (!cancelled) {
        setMatches(
          result.data.filter(
            (user) => !rows.some((row) => row.username === user.username),
          ),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [query, rows]);

  const dirty =
    JSON.stringify(rows.map((r) => [r.username, r.role])) !==
    JSON.stringify(event.participants.map((r) => [r.username, r.role]));

  const add = (user: MentionUser) => {
    setRows((current) => [
      ...current,
      {
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
        channelSlug: null,
        role: 'PERFORMER',
        status: 'PENDING',
      },
    ]);
    setQuery('');
  };

  const save = () => {
    setBusy(true);
    void setEventParticipants(
      event.id,
      rows.map((row) => ({ username: row.username, role: row.role })),
    ).then((result) => {
      setBusy(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t('events.tagsSaved'));
      onSaved(result.data);
    });
  };

  return (
    <div className="flex flex-col gap-3" data-testid="event-participants">
      {rows.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          {t('events.noTags')}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li
              key={row.username}
              className="border-border flex flex-wrap items-center gap-2 rounded-md border p-2 text-sm"
            >
              <MediaArtwork
                src={row.avatarUrl}
                alt=""
                seed={row.username}
                size="sm"
                className="size-8 rounded-full"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{row.displayName}</div>
                <div className="text-foreground-secondary text-xs">
                  @{row.username} · {t(`events.tag${row.status}`)}
                </div>
              </div>
              <Select
                className="w-36"
                aria-label={t('events.roleFor', { name: row.displayName })}
                options={ROLES.map((role) => ({
                  id: role,
                  label: t(`events.role${role}`),
                }))}
                value={row.role}
                onValueChange={(role) =>
                  setRows((current) =>
                    current.map((item) =>
                      item.username === row.username
                        ? { ...item, role: role as ArtistEventRole }
                        : item,
                    ),
                  )
                }
              />
              <Button
                size="icon-sm"
                variant="text"
                aria-label={t('events.removeTag', { name: row.displayName })}
                onClick={() =>
                  setRows((current) =>
                    current.filter((item) => item.username !== row.username),
                  )
                }
              >
                <XIcon size={14} aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {rows.length < MAX_TAGS ? (
        <div className="flex flex-col gap-1">
          <Input
            label={t('events.tagSomeone')}
            placeholder={t('events.searchPeople')}
            value={query}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => setQuery(e.target.value)}
          />
          {matches.length > 0 ? (
            <ul
              className="border-border flex flex-col rounded-md border"
              aria-label={t('events.matches')}
            >
              {matches.map((user) => (
                <li key={user.username}>
                  <Button
                    variant="text"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => add(user)}
                  >
                    <UserPlusIcon size={14} aria-hidden />
                    {user.displayName}
                    <span className="text-foreground-secondary text-xs">
                      @{user.username}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <div>
        <Button size="sm" disabled={!dirty || busy} onClick={save}>
          {busy ? t('events.saving') : t('events.saveTags')}
        </Button>
      </div>
    </div>
  );
}
