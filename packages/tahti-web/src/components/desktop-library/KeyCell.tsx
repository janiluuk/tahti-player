import { formatKey, keyHue } from '../../lib/musicalKey';
import { useDjPrefsStore } from '../../stores/djPrefsStore';

export function KeyCell({ value }: { value: string | null }) {
  const notation = useDjPrefsStore((state) => state.keyNotation);
  const label = formatKey(value, notation);
  if (!label) {
    return <>—</>;
  }
  const hue = keyHue(value);
  return (
    <span className="inline-flex items-center gap-1.5" title={value ?? ''}>
      {hue !== null ? (
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ background: `hsl(${hue} 70% 55%)` }}
          aria-hidden
          data-testid="key-wheel-dot"
        />
      ) : null}
      {label}
    </span>
  );
}
