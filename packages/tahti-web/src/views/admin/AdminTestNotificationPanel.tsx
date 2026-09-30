import { SendIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Input, Textarea } from '@tahti-player/ui';

import { sendAdminTestNotification } from '../../api/admin';
import { StudioPanel } from '../../components/StudioPanel';

export function AdminTestNotificationPanel() {
  const [username, setUsername] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [sending, setSending] = useState(false);

  const targetUsername = username.trim().replace(/^@/, '');
  const canSend = targetUsername.length > 0 && title.trim().length > 0;

  const send = async () => {
    setSending(true);
    const result = await sendAdminTestNotification({
      targetUsername,
      title: title.trim(),
      body: body.trim() || undefined,
      url: url.trim() || undefined,
    });
    setSending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Test notification sent to @${targetUsername}.`);
    setTitle('');
    setBody('');
    setUrl('');
  };

  return (
    <StudioPanel
      title="Send a test notification"
      description="Delivers one notification to a single member, e.g. to check how a message looks before an announcement."
    >
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSend && !sending) {
            void send();
          }
        }}
      >
        <Input
          label="Username"
          value={username}
          maxLength={33}
          placeholder="@username"
          onChange={(event) => setUsername(event.target.value)}
        />
        <Input
          label="Title"
          value={title}
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
        />
        <label className="flex flex-col gap-1 text-sm">
          Message (optional)
          <Textarea
            value={body}
            maxLength={500}
            rows={3}
            onChange={(event) => setBody(event.target.value)}
          />
        </label>
        <Input
          label="Link (optional)"
          value={url}
          maxLength={300}
          placeholder="/news"
          onChange={(event) => setUrl(event.target.value)}
        />
        <div>
          <Button type="submit" size="sm" disabled={!canSend || sending}>
            <SendIcon size={14} aria-hidden className="mr-1.5" />
            {sending ? 'Sending…' : 'Send test'}
          </Button>
        </div>
      </form>
    </StudioPanel>
  );
}
