import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ColorScheme } from '@tahti-web/api/channel-design';
import { PlayerGradientControls } from '@tahti-web/components/channel-designer/PlayerGradientControls';
import { useState } from 'react';

const meta: Meta<typeof PlayerGradientControls> = {
  title: 'Tahti/Channel/Designer/PlayerGradientControls',
  component: PlayerGradientControls,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const scheme: ColorScheme = {
  accent: '#22D3EE',
  highlight: '#A78BFA',
  bg: '#0B1220',
  text: '#F8FAFC',
  muted: '#64748B',
};

function Demo({ enabled }: { enabled: boolean }) {
  const [usePlayerGradient, setUsePlayerGradient] = useState(enabled);
  const [playerScheme, setPlayerScheme] = useState<ColorScheme>(scheme);
  return (
    <div className="max-w-md">
      <PlayerGradientControls
        usePlayerGradient={usePlayerGradient}
        playerScheme={playerScheme}
        onUsePlayerGradient={setUsePlayerGradient}
        onPlayerSchemeChange={setPlayerScheme}
        onPlayerBrandAccent={(brand) =>
          setPlayerScheme((current) => ({
            ...current,
            accent: brand.accent,
            highlight: brand.highlight,
          }))
        }
      />
    </div>
  );
}

export const Off: Story = {
  name: 'Matches header (off)',
  render: () => <Demo enabled={false} />,
};

export const On: Story = {
  name: 'Separate player palette',
  render: () => <Demo enabled={true} />,
};
