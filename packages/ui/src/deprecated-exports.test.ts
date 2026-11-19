import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)));

const DEPRECATIONS: Array<{ file: string; symbol: string }> = [
  { file: 'components/Mosaic/Mosaic.tsx', symbol: 'Mosaic' },
  { file: 'components/TopBar.tsx', symbol: 'TopBar' },
  { file: 'components/TopBarLogo.tsx', symbol: 'TopBarLogo' },
  { file: 'components/TopBarNavigation.tsx', symbol: 'TopBarNavigation' },
  {
    file: 'components/Breadcrumbs/Breadcrumbs.tsx',
    symbol: 'BreadcrumbAnchor',
  },
  { file: 'components/BackButton/BackButton.tsx', symbol: 'BackButtonAnchor' },
  { file: 'components/Slider/Slider.tsx', symbol: 'SliderHeader' },
  { file: 'components/Slider/Slider.tsx', symbol: 'SliderTrack' },
  { file: 'components/Slider/Slider.tsx', symbol: 'SliderRangeInput' },
  { file: 'components/Slider/Slider.tsx', symbol: 'SliderSurface' },
  { file: 'components/Slider/Slider.tsx', symbol: 'SliderFooter' },
];

describe('deprecated library exports', () => {
  it.each(DEPRECATIONS)(
    'marks $symbol with @deprecated in $file',
    ({ file, symbol }) => {
      const source = readFileSync(join(root, file), 'utf8');
      expect(source).toMatch(
        new RegExp(
          `@deprecated[\\s\\S]{0,200}export (?:const|function|type) ${symbol}`,
        ),
      );
    },
  );
});
