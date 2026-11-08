import { SendIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Dialog, Input, SaveButton, Textarea, Toggle } from '@tahti-player/ui';

import { createNewsletterDraft } from '../../../api/studio-extras';

/** Compose a newsletter draft (saved, not sent). Mount only while open. */
export function NewDraftDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation('web');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [fansOnly, setFansOnly] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!subject.trim() || !body.trim() || busy) {
      return;
    }
    setBusy(true);
    try {
      const r = await createNewsletterDraft({
        subject: subject.trim(),
        bodyMd: body.trim(),
        subscribersOnly: fansOnly,
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(i18n.t('web:toasts.draftSaved'));
      onSaved();
      onClose();
    } catch {
      toast.error(i18n.t('web:toasts.couldNotSaveDraft'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root isOpen onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Dialog.Title>
          <span className="inline-flex items-center gap-2">
            <SendIcon size={18} aria-hidden />
            {t('newDraft.newDraft')}
          </span>
        </Dialog.Title>
        <div className="mt-4 flex flex-col gap-3">
          <Input
            label={t('newDraft.subject')}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            autoFocus
          />
          <Textarea
            submitOnModEnter
            label={t('newDraft.bodyMarkdown')}
            tone="secondary"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            required
          />
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>{t('newDraft.fansSubscribersOnly')}</span>
            <Toggle
              label={t('newDraft.fansSubscribersOnly')}
              checked={fansOnly}
              onChange={setFansOnly}
            />
          </div>
        </div>
        <Dialog.Actions>
          <Dialog.Close>{t('newDraft.cancel')}</Dialog.Close>
          <SaveButton
            type="submit"
            disabled={!subject.trim() || !body.trim()}
            saving={busy}
            label={t('newDraft.saveDraft')}
          />
        </Dialog.Actions>
      </form>
    </Dialog.Root>
  );
}
