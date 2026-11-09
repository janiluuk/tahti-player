import { useTranslation } from '@tahti-player/i18n';

import { ChannelChatPanel } from '../ChannelChatPanel';
import { Eyebrow } from '../tahti/Eyebrow';

/** The host channel's own chat, where the artist tells the story behind
 * each track as it plays. Moderation is the channel's usual chat
 * moderation. */
export function ListeningPartyChat({
  channelSlug,
  channelName,
}: {
  channelSlug: string;
  channelName: string;
}) {
  const { t } = useTranslation('web');
  return (
    <section
      aria-label={t('listeningPartyChatText.partyChat')}
      className="flex flex-col gap-3"
    >
      <Eyebrow tone="green">Chat · {channelName}</Eyebrow>
      <ChannelChatPanel key={channelSlug} slug={channelSlug} compact />
    </section>
  );
}
