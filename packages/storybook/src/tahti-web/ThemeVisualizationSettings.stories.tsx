import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeVisualizationSettings } from '@tahti-web/components/ThemeVisualizationSettings';

/**
 * Background visualization controls for Tahti themes (Settings → General
 * and the theme Configure dialog). Reads/writes `useAmbientStore`; falls
 * back to the active `useThemeStore` theme when `themeId` isn't passed.
 * The default theme (`nuclear:tahti-dark`) supports visualization, so the
 * full preset/opacity/speed/intensity/audio-reactivity controls show by
 * default here.
 */
const meta: Meta<typeof ThemeVisualizationSettings> = {
  title: 'Tahti/Settings/ThemeVisualizationSettings',
  component: ThemeVisualizationSettings,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const UnsupportedTheme: Story = {
  name: 'Unsupported theme',
  args: { themeId: 'nuclear:some-other-theme' },
};
