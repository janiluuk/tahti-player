import { Button } from '@tahti-player/ui';

import { BRAND_ACCENTS } from '../../api/channel-design';

type Props = {
  selectedId: string | null | undefined;
  onSelect: (brand: (typeof BRAND_ACCENTS)[number]) => void;
};

/** Brand gradient swatches used across Backdrop / Player color editors. */
export function BrandAccentSwatches({ selectedId, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {BRAND_ACCENTS.map((brand) => (
        <Button
          variant="plain"
          size="flexible"
          key={brand.id}
          type="button"
          title={brand.label}
          aria-label={brand.label}
          aria-pressed={selectedId === brand.id}
          onClick={() => onSelect(brand)}
          className={`inline-block h-9 w-14 rounded-md border-2 whitespace-normal transition-transform hover:scale-105 active:scale-100 ${
            selectedId === brand.id
              ? 'border-primary shadow-md'
              : 'border-transparent'
          }`}
          style={{ background: brand.gradient }}
        />
      ))}
    </div>
  );
}
