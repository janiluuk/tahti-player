import { useEffect, useState } from 'react';

import { Button, MediaArtwork } from '@tahti-player/ui';

import {
  fetchMessageContacts,
  type MessageContact,
} from '../api/message-contacts';
import { placeholderArtworkUrl } from '../lib/placeholderArt';

const VISIBLE_CONTACTS = 12;

const relation = (contact: MessageContact) =>
  contact.followsYou && contact.followedByYou
    ? 'You follow each other'
    : contact.followsYou
      ? 'Follows you'
      : 'You follow';

/** People you follow or who follow you, one click from a new DM. */
export function MessageContacts({
  onPick,
  disabled,
}: {
  onPick: (username: string) => void;
  disabled?: boolean;
}) {
  const [contacts, setContacts] = useState<MessageContact[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchMessageContacts().then((result) => {
      if (!cancelled) {
        setContacts(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (contacts.length === 0) {
    return null;
  }

  const visible = showAll ? contacts : contacts.slice(0, VISIBLE_CONTACTS);

  return (
    <section className="flex flex-col gap-2" aria-label="Your contacts">
      <h2 className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
        Your contacts
      </h2>
      <ul className="flex flex-wrap gap-2" data-testid="message-contacts">
        {visible.map((contact) => (
          <li key={contact.username}>
            <Button
              variant="secondary"
              size="sm"
              disabled={disabled}
              title={relation(contact)}
              aria-label={`Message ${contact.displayName}`}
              onClick={() => onPick(contact.username)}
              className="gap-2"
            >
              <MediaArtwork
                src={
                  contact.avatarUrl ?? placeholderArtworkUrl(contact.username)
                }
                alt=""
                size="sm"
                className="size-5 min-w-5 rounded-full"
              />
              {contact.displayName}
            </Button>
          </li>
        ))}
      </ul>
      {contacts.length > VISIBLE_CONTACTS && !showAll ? (
        <Button
          variant="text"
          size="sm"
          className="self-start"
          onClick={() => setShowAll(true)}
        >
          Show all {contacts.length}
        </Button>
      ) : null}
    </section>
  );
}
