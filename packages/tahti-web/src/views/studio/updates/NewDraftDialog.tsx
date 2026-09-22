import { SendIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
      toast.success('Draft saved.');
      onSaved();
      onClose();
    } catch {
      toast.error('Could not save the draft.');
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
            New draft
          </span>
        </Dialog.Title>
        <div className="mt-4 flex flex-col gap-3">
          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            autoFocus
          />
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-foreground-secondary text-xs uppercase">
              Body (markdown)
            </span>
            <Textarea
              tone="secondary"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              required
            />
          </label>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>Fans / subscribers only</span>
            <Toggle
              label="Fans / subscribers only"
              checked={fansOnly}
              onChange={setFansOnly}
            />
          </div>
        </div>
        <Dialog.Actions>
          <Dialog.Close>Cancel</Dialog.Close>
          <SaveButton
            type="submit"
            disabled={!subject.trim() || !body.trim()}
            saving={busy}
            label="Save draft"
          />
        </Dialog.Actions>
      </form>
    </Dialog.Root>
  );
}
