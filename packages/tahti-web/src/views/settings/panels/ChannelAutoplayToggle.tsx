import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  fetchChannelAutoplay,
  setChannelAutoplay,
} from '../../../api/channel-autoplay';
import { SettingsToggle } from '../SettingsFields';

/** The artist's switch for their channel page starting playback on its own
 * when a listener opens it. Hidden until the setting has been read. */
export function ChannelAutoplayToggle() {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchChannelAutoplay().then((value) => {
      if (!cancelled) {
        setEnabled(value);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (enabled === null) {
    return null;
  }

  return (
    <SettingsToggle
      label="Start playing when someone opens my channel"
      description="Your channel starts on its own, muted until the listener unmutes it. If they are already listening to something, it fades over to your channel. Listeners can switch this off for themselves."
      value={enabled}
      onChange={(value) => {
        const previous = enabled;
        setEnabled(value);
        void setChannelAutoplay(value).then((result) => {
          if (!result.ok) {
            setEnabled(previous);
            toast.error(result.error);
            return;
          }
          toast.success('Autoplay setting saved.');
        });
      }}
    />
  );
}
