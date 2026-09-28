import { useState } from 'react';

import { Button, Input, Select, Textarea } from '@tahti-player/ui';

import { submitSupportTicket, type SupportTicketCategory } from '../api/client';
import { useAuthStore } from '../stores/authStore';

const CATEGORIES: Array<{ value: SupportTicketCategory; label: string }> = [
  { value: 'ENGAGEMENT_DISPUTE', label: 'Engagement units' },
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'FINANCIAL', label: 'Billing / payouts' },
  { value: 'OTHER', label: 'Other' },
];

export function SupportContactForm() {
  const email = useAuthStore((s) => s.user?.email);
  const [contactEmail, setContactEmail] = useState('');
  const [category, setCategory] = useState<SupportTicketCategory>('OTHER');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);

  if (ticketId) {
    return (
      <div className="border-border bg-background-secondary/30 rounded-lg border p-4 text-sm">
        <p className="font-medium">We received your message.</p>
        <p className="text-foreground-secondary mt-1">
          Expect a reply within two business days for engagement and billing
          questions.
        </p>
      </div>
    );
  }

  return (
    <form
      className="border-border flex flex-col gap-3 rounded-lg border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        void submitSupportTicket({
          subject: subject.trim(),
          message: message.trim(),
          category,
          ...(email ? {} : { contactEmail: contactEmail.trim() }),
        }).then((result) => {
          setPending(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setTicketId(result.ticketId);
        });
      }}
    >
      <h2 className="font-display text-lg font-bold">Contact support</h2>
      {!email && (
        <Input
          label="Your email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          required
        />
      )}
      <Select
        label="Category"
        options={CATEGORIES.map((option) => ({
          id: option.value,
          label: option.label,
        }))}
        value={category}
        onValueChange={(value) => setCategory(value as SupportTicketCategory)}
      />
      <Input
        label="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        required
        maxLength={200}
      />
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-foreground-secondary text-xs uppercase">
          Message
        </span>
        <Textarea
          tone="secondary"
          className="min-h-[8rem]"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          maxLength={5000}
          rows={6}
        />
      </label>
      <Button
        type="submit"
        disabled={
          pending ||
          !subject.trim() ||
          !message.trim() ||
          (!email && !contactEmail.trim())
        }
      >
        {pending ? 'Sending…' : 'Send message'}
      </Button>
      {error && <p className="text-accent-red-strong text-sm">{error}</p>}
    </form>
  );
}
