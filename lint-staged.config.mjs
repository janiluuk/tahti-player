const regenerateSurfaces = () =>
  'node scripts/generate-storybook-surfaces.mjs --stage';

export default {
  '*.{ts,tsx,js,jsx}': 'eslint --fix',
  'packages/storybook/src/**/*.stories.{ts,tsx,js,jsx,mjs}': regenerateSurfaces,
  'packages/tahti-web/STORYBOOK-SURFACES.md': regenerateSurfaces,
  '*.{ts,tsx,mjs}': () => 'node packages/tahti-ops/src/cli.mjs check size',
};
