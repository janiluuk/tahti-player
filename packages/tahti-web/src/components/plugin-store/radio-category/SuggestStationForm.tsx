import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Input } from '@tahti-player/ui';

/** "Suggest a station" toggle + form; sends the suggestion to the Tahti team
 * for review. */
export function SuggestStationForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [language, setLanguage] = useState('');
  const [bitrate, setBitrate] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const { submitRadioStationSuggestion } =
        await import('../../../api/admin');
      const r = await submitRadioStationSuggestion({
        name: name.trim(),
        logoUrl: logoUrl.trim(),
        language: language.trim(),
        bitrateKbps: bitrate.trim(),
        streamUrl: streamUrl.trim(),
      });
      if (!r.ok) {
        setMsg(r.error);
        toast.error(r.error);
        return;
      }
      const thanks = 'Thanks — sent to the Tahti team for review.';
      setMsg(thanks);
      toast.success(thanks);
      setName('');
      setLogoUrl('');
      setLanguage('');
      setBitrate('');
      setStreamUrl('');
    } catch {
      setMsg('Could not send the suggestion.');
      toast.error('Could not send the suggestion.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Cancel' : 'Suggest a station'}
        </Button>
      </div>

      {open && (
        <form
          className="border-border bg-background-secondary/40 flex flex-col gap-3 rounded-lg border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Station name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="Finnish"
            />
            <Input
              label="Bitrate (kbps)"
              value={bitrate}
              onChange={(e) => setBitrate(e.target.value)}
              placeholder="128"
            />
            <Input
              label="Logo URL"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://…"
            />
            <Input
              label="Stream URL"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="https://stream.example.fi/station.mp3"
              className="sm:col-span-2"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              type="submit"
              disabled={busy || !name.trim() || !streamUrl.trim()}
            >
              {busy ? 'Sending…' : 'Send for review'}
            </Button>
            {msg && <p className="text-foreground-secondary text-xs">{msg}</p>}
          </div>
        </form>
      )}
    </>
  );
}
