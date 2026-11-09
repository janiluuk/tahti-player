import { SendIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Button, Input, Textarea } from '@tahti-player/ui';

import { sendAdminTestNotification } from '../../api/admin';
import { StudioPanel } from '../../components/StudioPanel';

export function AdminTestNotificationPanel() {
  const { t } = useTranslation('web');
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
    toast.success(
      i18n.t('web:toasts.testNotificationSent', { username: targetUsername }),
    );
    setTitle('');
    setBody('');
    setUrl('');
  };

  return (
    <StudioPanel
      title={t('adminTestNotificationPanel.sendATestNotification')}
      description={t('adminTestNotificationPanel.deliversOneNotificationToA')}
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
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          label={t('adminTestNotificationPanel.username')}
          value={username}
          maxLength={33}
          placeholder="@username"
          onChange={(event) => setUsername(event.target.value)}
        />
        <Input
          label={t('adminTestNotificationPanel.title')}
          value={title}
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Textarea
          submitOnModEnter
          label={t('adminTestNotificationPanel.messageOptional')}
          value={body}
          maxLength={500}
          rows={3}
          onChange={(event) => setBody(event.target.value)}
        />
        <Input
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          label={t('adminTestNotificationPanel.linkOptional')}
          value={url}
          maxLength={300}
          placeholder="/news"
          onChange={(event) => setUrl(event.target.value)}
        />
        <div>
          <Button type="submit" size="sm" disabled={!canSend || sending}>
            <SendIcon size={14} aria-hidden className="mr-1.5" />
            {sending
              ? t('adminTestNotificationPanelStates.sending')
              : t('adminTestNotificationPanelStates.sendTest')}
          </Button>
        </div>
      </form>
    </StudioPanel>
  );
}
