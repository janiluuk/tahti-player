import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AudioPluginToggleRow,
  ConfigurableCard,
} from '@tahti-web/components/plugin-store/shared';
import { useState } from 'react';

import { PluginStoreItem } from '@tahti-player/ui';

/**
 * The two shells every PluginStorePanel category card is built from:
 * `ConfigurableCard` (a gear button that folds out a settings panel below
 * the card) and `AudioPluginToggleRow` (a `PluginStoreItem` with a
 * power-toggle accessory, for simple on/off audio plugins). Every other
 * category — Radio, Visualizers, Export, Import, Fingerprinting,
 * Multicast, Audio — composes one or both of these.
 */
const meta: Meta = {
  title: 'Tahti/Widgets/PluginStorePanel/Shared cards',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

function ConfigurableCardDemo() {
  const [installed, setInstalled] = useState(false);
  return (
    <ConfigurableCard
      title="Demo plugin"
      header={(open) => (
        <PluginStoreItem
          name="Demo plugin"
          author="Tahti · example"
          description="A stand-in card showing the gear-toggle fold-out shell shared by every category."
          isInstalled={installed}
          onInstall={open}
          labels={{ install: 'Configure', installed: 'Configured' }}
        />
      )}
    >
      <p className="text-foreground-secondary text-sm">
        Anything category-specific renders here — form fields, tabs, lists.
      </p>
      <button
        type="button"
        className="text-primary self-start text-sm underline-offset-2 hover:underline"
        onClick={() => setInstalled((v) => !v)}
      >
        Toggle "configured" state
      </button>
    </ConfigurableCard>
  );
}

function AudioPluginToggleRowDemo() {
  const [enabled, setEnabled] = useState(false);
  return (
    <AudioPluginToggleRow
      name="Demo audio plugin"
      author="Tahti · example"
      description="A stand-in card showing the simple activate/deactivate row used for plain on/off audio plugins."
      enabled={enabled}
      onToggle={() => setEnabled((v) => !v)}
    />
  );
}

export const ConfigurableCardShell: Story = {
  render: () => <ConfigurableCardDemo />,
};

export const AudioPluginToggleRowShell: Story = {
  render: () => <AudioPluginToggleRowDemo />,
};
