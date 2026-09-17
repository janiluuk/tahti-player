import { Toggle } from '@tahti-player/ui';

import {
  setItemVisible,
  type ChannelPageItem,
  type ChannelPageItemType,
} from '../../lib/channelPageLayout';

type Props = {
  layout: ChannelPageItem[];
  onLayoutChange: (
    updater:
      | ChannelPageItem[]
      | ((prev: ChannelPageItem[]) => ChannelPageItem[]),
  ) => void;
};

export function IdentityToggles({ layout, onLayoutChange }: Props) {
  return (
    <section className="border-border flex flex-col gap-3 rounded-lg border p-3">
      <h3 className="text-xs font-semibold tracking-wide uppercase">
        Identity
      </h3>
      {(
        [
          {
            type: 'avatar' as const,
            label: 'Show avatar',
          },
          {
            type: 'about' as const,
            label: 'Show bio',
          },
          {
            type: 'subscribe' as const,
            label: 'Show Subscribe button',
          },
        ] satisfies { type: ChannelPageItemType; label: string }[]
      ).map(({ type, label }) => {
        const row = layout.find((i) => i.type === type);
        const checked = row?.visible ?? type === 'avatar';
        return (
          <div
            key={type}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span>{label}</span>
            <Toggle
              label={label}
              checked={checked}
              onChange={(next) => {
                onLayoutChange((prev) => {
                  const existing = prev.find((i) => i.type === type);
                  return existing
                    ? setItemVisible(prev, existing.id, next)
                    : prev;
                });
              }}
            />
          </div>
        );
      })}
    </section>
  );
}
