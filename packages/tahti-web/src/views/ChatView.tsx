import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button, Select, ViewShell } from '@tahti-player/ui';

import { fetchChatHistory, fetchDirectory } from '../api/client';
import type { ChannelDirectoryItem } from '../api/types';
import { ChannelChatPanel } from '../components/ChannelChatPanel';
import { PageBackLink } from '../components/PageBackLink';
import { PageEmpty, PageLoading } from '../components/PageStates';
import {
  chatActivity,
  chatActivityLabel,
  type ChatActivity,
} from '../lib/chatActivity';
import { humanizePastDate } from '../lib/humanizeDate';

type ChannelActivity = {
  channel: ChannelDirectoryItem;
  activity: ChatActivity;
};

function channelName(channel: ChannelDirectoryItem): string {
  return channel.displayName.trim() || channel.username;
}

/** Each directory channel's chat activity over the last 24 hours, busiest
 * first. `null` while the histories load. */
function useChatActivity(channels: ChannelDirectoryItem[] | null) {
  const [rows, setRows] = useState<ChannelActivity[] | null>(null);
  useEffect(() => {
    if (!channels) {
      return;
    }
    let cancelled = false;
    setRows(null);
    void Promise.all(
      channels.map(async (channel) => ({
        channel,
        activity: chatActivity((await fetchChatHistory(channel.slug)).data),
      })),
    ).then((all) => {
      if (!cancelled) {
        setRows(
          all
            .filter((row) => row.activity.count > 0)
            .sort(
              (a, b) =>
                b.activity.count - a.activity.count ||
                (b.activity.lastTs ?? 0) - (a.activity.lastTs ?? 0),
            ),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [channels]);
  return rows;
}

function ChatPicker() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const [channels, setChannels] = useState<ChannelDirectoryItem[] | null>(null);
  const [selected, setSelected] = useState('');
  const activity = useChatActivity(channels);

  useEffect(() => {
    let cancelled = false;
    void fetchDirectory().then(({ data }) => {
      if (!cancelled) {
        setChannels(data.items);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(
    () =>
      [...(channels ?? [])]
        .sort((a, b) => channelName(a).localeCompare(channelName(b)))
        .map((channel) => ({ id: channel.slug, label: channelName(channel) })),
    [channels],
  );
  const target = selected || activity?.[0]?.channel.slug || options[0]?.id;

  return (
    <ViewShell
      title={t('chatView.chat')}
      subtitle={t('chatView.pickAChannelToJoin')}
      classes={{
        root: 'px-0 pt-0 mx-auto max-w-lg',
        content: 'gap-6',
      }}
    >
      {channels === null ? (
        <PageLoading label={t('loading.loadingChannels')} />
      ) : (
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (target) {
              void navigate({ to: '/chat/$slug', params: { slug: target } });
            }
          }}
        >
          <div className="min-w-0 flex-1">
            <Select
              label={t('chatView.channel')}
              options={options}
              value={target}
              onValueChange={setSelected}
            />
          </div>
          <Button type="submit" disabled={!target}>
            {t('chatView.openChat')}
          </Button>
        </form>
      )}
      <section
        aria-labelledby="chat-activity-heading"
        className="flex flex-col gap-3"
        data-testid="chat-activity"
      >
        <h2 id="chat-activity-heading" className="text-sm font-bold">
          {t('chatView.activityInTheLast24')}
        </h2>
        {channels === null || activity === null ? (
          <PageLoading label={t('loading.checkingChatRooms')} />
        ) : activity.length === 0 ? (
          <PageEmpty title={t('empties.noChatActivity')} />
        ) : (
          <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
            {activity.map(({ channel, activity: row }) => (
              <li key={channel.slug}>
                <Link
                  to="/chat/$slug"
                  params={{ slug: channel.slug }}
                  className="hover:bg-background-secondary flex items-center gap-3 px-3 py-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {channelName(channel)}
                    </span>
                    {row.lastTs ? (
                      <span className="text-foreground-secondary block text-xs">
                        Last message{' '}
                        {humanizePastDate(new Date(row.lastTs).toISOString())}
                      </span>
                    ) : null}
                  </span>
                  <Badge variant="pill" color="secondary">
                    {chatActivityLabel(row)}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ViewShell>
  );
}

export function ChatView({ slug }: { slug?: string }) {
  const { t } = useTranslation('web');
  if (!slug) {
    return <ChatPicker />;
  }

  return (
    <ViewShell
      title={t('chatView.chat')}
      subtitle={slug}
      classes={{
        root: 'px-0 pt-0 mx-auto max-w-lg',
        content: 'gap-6',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PageBackLink to="/chat" label={t('chatView.chatPicker')} />
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/channel/$slug"
            params={{ slug }}
            className="text-foreground-secondary text-sm underline-offset-2 hover:underline"
          >
            {t('actions.openChannel')}
          </Link>
        </div>
      </div>
      <ChannelChatPanel key={slug} slug={slug} />
    </ViewShell>
  );
}
