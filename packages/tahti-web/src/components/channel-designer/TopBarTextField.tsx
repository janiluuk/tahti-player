import { Input } from '@tahti-player/ui';

export const TOP_BAR_TEXT_MAX_LENGTH = 120;

type Props = {
  value: string;
  onChange: (next: string) => void;
};

/** Short line shown in a strip across the top of the channel hero. */
export function TopBarTextField({ value, onChange }: Props) {
  return (
    <section className="border-border flex flex-col gap-3 rounded-lg border p-3">
      <h3 className="text-xs font-semibold tracking-wide uppercase">Top bar</h3>
      <Input
        label="Top bar text"
        value={value}
        maxLength={TOP_BAR_TEXT_MAX_LENGTH}
        placeholder="e.g. New album out Friday"
        onChange={(event) => onChange(event.target.value)}
      />
    </section>
  );
}
