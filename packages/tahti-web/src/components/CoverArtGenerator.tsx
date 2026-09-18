import { RotateCcwIcon } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import {
  Button,
  SelectableTiles,
  Slider,
  type SelectableTile,
} from '@tahti-player/ui';

import {
  BACKGROUND_COLORS,
  COLOR_PALETTES,
  DEFAULT_BG,
  DEFAULT_PRESET_ID,
  DESIGN_PRESETS,
  DesignCanvasImpl,
  getDesignPreset,
  getPaletteColors,
  type DesignCanvasHandle,
} from '../lib/canvas-designer';
import { cn } from '../lib/cn';

const STYLE_OPTIONS: SelectableTile[] = DESIGN_PRESETS.map((preset) => ({
  id: preset.id,
  label: preset.label,
  description: preset.description,
}));

type Props = {
  onGenerate: (file: File) => void;
  generating?: boolean;
};

/**
 * Draw-to-generate symmetric cover art (Weave Silk-style trail generator),
 * exported at 3000x3000 (standard album art size) for release artwork.
 */
export function CoverArtGenerator({ onGenerate, generating }: Props) {
  const [presetId, setPresetId] = useState(DEFAULT_PRESET_ID);
  const [paletteId, setPaletteId] = useState(COLOR_PALETTES[0]!.id);
  const [bgColor, setBgColor] = useState(DEFAULT_BG);
  const [brushSize, setBrushSize] = useState(3);
  const [glowIntensity, setGlowIntensity] = useState(4);
  const [canvasKey, setCanvasKey] = useState(0);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<DesignCanvasHandle>(null);

  const preset = useMemo(() => getDesignPreset(presetId), [presetId]);
  const colors = useMemo(() => getPaletteColors(paletteId), [paletteId]);

  const handleClear = () => {
    setCanvasKey((k) => k + 1);
    setHasDrawn(false);
  };

  const handleUse = async () => {
    const dataUrl = canvasRef.current?.exportPng();
    if (!dataUrl) {
      return;
    }
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], `cover-${Date.now()}.png`, {
      type: 'image/png',
    });
    onGenerate(file);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-foreground-secondary text-xs">
        Draw on the canvas to create a symmetric generative cover, then use it
        as this release&apos;s artwork.
      </p>

      <div
        className="border-border aspect-square w-full overflow-hidden rounded-lg border-(length:--border-width)"
        onPointerDown={() => setHasDrawn(true)}
      >
        <DesignCanvasImpl
          key={canvasKey}
          ref={canvasRef}
          preset={preset}
          colors={colors}
          bgColor={bgColor}
          brushSize={brushSize}
          glowIntensity={glowIntensity}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-foreground-secondary text-xs uppercase">
          Style
        </span>
        <SelectableTiles
          items={STYLE_OPTIONS}
          selected={presetId}
          onChange={setPresetId}
          className="grid-cols-2 sm:grid-cols-3"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-foreground-secondary text-xs uppercase">
          Palette
        </span>
        <div className="flex flex-wrap gap-2">
          {COLOR_PALETTES.map((palette) => (
            <button
              key={palette.id}
              type="button"
              title={palette.label}
              aria-label={palette.label}
              aria-pressed={paletteId === palette.id}
              onClick={() => setPaletteId(palette.id)}
              className={cn(
                'h-9 w-14 overflow-hidden rounded-md border-2 transition-transform hover:scale-105',
                paletteId === palette.id
                  ? 'border-primary shadow-md'
                  : 'border-transparent',
              )}
              style={{
                background: `linear-gradient(90deg, ${palette.colors.join(', ')})`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-foreground-secondary text-xs uppercase">
          Background
        </span>
        <div className="flex flex-wrap gap-2">
          {BACKGROUND_COLORS.map((bg) => (
            <button
              key={bg.id}
              type="button"
              title={bg.id}
              aria-label={bg.id}
              aria-pressed={bgColor === bg.hex}
              onClick={() => setBgColor(bg.hex)}
              className={cn(
                'border-border size-8 rounded-full border-(length:--border-width) transition-transform hover:scale-105',
                bgColor === bg.hex && 'ring-primary ring-2 ring-offset-2',
              )}
              style={{ background: bg.hex }}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Slider
          label="Brush size"
          value={brushSize}
          min={1}
          max={10}
          step={1}
          showFooter={false}
          onValueChange={setBrushSize}
        />
        <Slider
          label="Glow"
          value={glowIntensity}
          min={0}
          max={10}
          step={1}
          showFooter={false}
          onValueChange={setGlowIntensity}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button variant="text" size="flexible" onClick={handleClear}>
          <RotateCcwIcon size={14} aria-hidden className="mr-1.5" />
          Clear
        </Button>
        <Button
          onClick={() => void handleUse()}
          disabled={!hasDrawn || generating}
        >
          Use this artwork
        </Button>
      </div>
    </div>
  );
}
