import { Toggle } from '@tahti-player/ui';

import { BRAND_ACCENTS, type ColorScheme } from '../../api/channel-design';
import { Eyebrow } from '../tahti/Eyebrow';
import { BrandAccentSwatches } from './BrandAccentSwatches';
import { ColorSchemeFields } from './ColorSchemeFields';

type Props = {
  usePlayerGradient: boolean;
  playerScheme: ColorScheme;
  onUsePlayerGradient: (enabled: boolean) => void;
  onPlayerSchemeChange: (next: ColorScheme) => void;
  onPlayerBrandAccent: (brand: (typeof BRAND_ACCENTS)[number]) => void;
};

/** Player tab → Gradient: optional separate palette from the channel header. */
export function PlayerGradientControls({
  usePlayerGradient,
  playerScheme,
  onUsePlayerGradient,
  onPlayerSchemeChange,
  onPlayerBrandAccent,
}: Props) {
  const selectedBrand = BRAND_ACCENTS.find(
    (brand) =>
      brand.accent === playerScheme.accent &&
      brand.highlight === playerScheme.highlight,
  );

  return (
    <section
      className="flex flex-col gap-4"
      data-testid="channel-player-gradient"
    >
      <div className="border-border bg-background-secondary/40 flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
        <span>
          <span className="block font-semibold">
            Use a separate gradient for the player
          </span>
          <span className="text-foreground-secondary block text-xs">
            Off by default — the player reuses the gradient set above for the
            channel header.
          </span>
        </span>
        <Toggle
          label="Use a separate gradient for the player"
          checked={usePlayerGradient}
          onChange={onUsePlayerGradient}
        />
      </div>
      {usePlayerGradient ? (
        <>
          <div className="flex flex-col gap-2">
            <Eyebrow>Gradient presets</Eyebrow>
            <BrandAccentSwatches
              selectedId={selectedBrand?.id}
              onSelect={onPlayerBrandAccent}
            />
          </div>
          <ColorSchemeFields
            scheme={playerScheme}
            onChange={onPlayerSchemeChange}
          />
        </>
      ) : (
        <p className="text-foreground-secondary text-xs">
          The player currently matches the channel header&apos;s gradient, set
          in Header.
        </p>
      )}
    </section>
  );
}
