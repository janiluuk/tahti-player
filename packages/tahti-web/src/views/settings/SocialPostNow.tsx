import { SendIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, Select, Textarea } from '@tahti-player/ui';

import {
  fetchSocialPosts,
  postToSocial,
  type SocialAutoPostSettings,
  type SocialPostLog,
  type SocialPostPlatform,
} from '../../api/social-autopost';
import { SettingsHint } from './SettingsFields';

const PLATFORM_NAMES: Record<SocialPostPlatform, string> = {
  MASTODON: 'Mastodon',
  BLUESKY: 'Bluesky',
  TWITTER: 'X / Twitter',
  INSTAGRAM: 'Instagram',
};

const PLATFORM_KEYS: Record<SocialPostPlatform, keyof SocialAutoPostSettings> =
  {
    MASTODON: 'mastodon',
    BLUESKY: 'bluesky',
    TWITTER: 'twitter',
    INSTAGRAM: 'instagram',
  };

const STATE_BADGE: Record<
  SocialPostLog['state'],
  { label: string; color: 'green' | 'orange' | 'red' }
> = {
  SENT: { label: 'Sent', color: 'green' },
  PENDING: { label: 'Queued', color: 'orange' },
  FAILED: { label: 'Failed', color: 'red' },
};

const TRIGGER_LABEL: Record<string, string> = {
  manual: 'Posted by hand',
  release_published: 'New release',
  channel_live: 'Went live',
};

export function connectedPlatforms(
  settings: SocialAutoPostSettings,
): SocialPostPlatform[] {
  return (Object.keys(PLATFORM_KEYS) as SocialPostPlatform[]).filter(
    (platform) => settings[PLATFORM_KEYS[platform]].connected,
  );
}

export function SocialPostNow({
  settings,
}: {
  settings: SocialAutoPostSettings;
}) {
  const platforms = connectedPlatforms(settings);
  const [platform, setPlatform] = useState<SocialPostPlatform | null>(
    platforms[0] ?? null,
  );
  const [message, setMessage] = useState('');
  const [posting, setPosting] = useState(false);
  const [posts, setPosts] = useState<SocialPostLog[] | null>(null);

  const loadPosts = () => {
    void fetchSocialPosts().then((result) => setPosts(result.data));
  };

  useEffect(loadPosts, []);

  const selected =
    platform && platforms.includes(platform) ? platform : platforms[0];

  const submit = () => {
    if (!selected) {
      return;
    }
    setPosting(true);
    void postToSocial(selected, message.trim()).then((result) => {
      setPosting(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setMessage('');
      toast.success(`Queued for ${PLATFORM_NAMES[selected]}.`);
      loadPosts();
    });
  };

  return (
    <div className="flex flex-col gap-3" data-testid="social-post-now">
      {selected ? (
        <div className="border-border flex flex-col gap-3 rounded-lg border p-4">
          <h3 className="text-sm font-semibold">Post now</h3>
          {platforms.length > 1 ? (
            <Select
              label="Post to"
              value={selected}
              onValueChange={(value) =>
                setPlatform(value as SocialPostPlatform)
              }
              options={platforms.map((id) => ({
                id,
                label: PLATFORM_NAMES[id],
              }))}
              className="max-w-56"
            />
          ) : null}
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Message
            <Textarea
              value={message}
              maxLength={500}
              rows={3}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={posting || !message.trim()}
              onClick={submit}
            >
              <SendIcon size={14} aria-hidden className="mr-1.5" />
              {posting ? 'Queuing…' : `Post to ${PLATFORM_NAMES[selected]}`}
            </Button>
          </div>
        </div>
      ) : null}

      {posts && posts.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Recent posts</h3>
          <ul
            className="divide-border divide-y text-sm"
            data-testid="social-posts"
          >
            {posts.map((post) => (
              <li key={post.id} className="flex flex-col gap-1 py-2">
                <span className="flex flex-wrap items-center gap-2">
                  <Badge variant="pill" color={STATE_BADGE[post.state].color}>
                    {STATE_BADGE[post.state].label}
                  </Badge>
                  <span className="text-foreground-secondary text-xs">
                    {PLATFORM_NAMES[post.platform]} ·{' '}
                    {TRIGGER_LABEL[post.trigger] ?? post.trigger} ·{' '}
                    {new Date(post.sentAt ?? post.createdAt).toLocaleString()}
                  </span>
                </span>
                <span className="break-words whitespace-pre-wrap">
                  {post.message}
                </span>
                {post.state === 'FAILED' && post.error ? (
                  <span className="text-accent-red-strong text-xs">
                    {post.error}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : posts && selected ? (
        <SettingsHint>Nothing posted yet.</SettingsHint>
      ) : null}
    </div>
  );
}
