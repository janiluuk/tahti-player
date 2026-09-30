import { useState } from 'react';
import { toast } from 'sonner';

import { SegmentedControl } from '@tahti-player/ui';

import { setAdminChannelKind, type ChannelKind } from '../../api/admin';

const OPTIONS = [
  { id: 'ARTIST', label: 'Artist' },
  { id: 'RADIO', label: 'Radio station' },
] as const;

export function AdminChannelKindControl({
  slug,
  initialKind,
}: {
  slug: string;
  initialKind: ChannelKind;
}) {
  const [kind, setKind] = useState<ChannelKind>(initialKind);
  const [saving, setSaving] = useState(false);

  const change = async (next: ChannelKind) => {
    if (next === kind || saving) {
      return;
    }
    const previous = kind;
    setKind(next);
    setSaving(true);
    const result = await setAdminChannelKind(slug, next);
    setSaving(false);
    if (!result.ok) {
      setKind(previous);
      toast.error(result.error);
      return;
    }
    setKind(result.channelKind);
    toast.success(
      result.channelKind === 'RADIO'
        ? `${slug} now shows as a radio station.`
        : `${slug} now shows as an artist channel.`,
    );
  };

  return (
    <SegmentedControl
      aria-label={`Channel type for ${slug}`}
      options={OPTIONS}
      value={kind}
      onChange={(next) => void change(next)}
    />
  );
}
