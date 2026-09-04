import {
  CHANNEL_LOOK_ELEMENTS,
  type ChannelLookElementId,
} from '../../lib/channelLookElements';

type Props = {
  elementId: ChannelLookElementId;
};

/**
 * Look rows that only toggle visibility on the public page (no style
 * controls). Copy comes from CHANNEL_LOOK_ELEMENTS.hint.
 */
export function LayoutOnlyLookHint({ elementId }: Props) {
  const meta = CHANNEL_LOOK_ELEMENTS.find(
    (element) => element.id === elementId,
  );
  return (
    <p
      className="text-foreground-secondary text-sm"
      data-testid={`channel-look-hint-${elementId}`}
    >
      {meta?.hint}. Hide this block with the eye button — visitors will not see
      it on your channel.
    </p>
  );
}

export const LAYOUT_ONLY_LOOK_IDS = [
  'releases',
  'tracks',
  'latest',
  'feed',
  'news',
  'bio',
  'shows',
  'gallery',
] as const satisfies readonly ChannelLookElementId[];
