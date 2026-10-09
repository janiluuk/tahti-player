import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChannelVizPackLabel } from '../channel-view/ChannelVizPackLabel';
import { ChannelVizPackPicker } from './ChannelVizPackPicker';

afterEach(cleanup);

describe('ChannelVizPackPicker', () => {
  it('marks "No pack" when nothing or an unknown pack is saved', () => {
    render(<ChannelVizPackPicker value="gone" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: /No pack/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('reports the picked pack id, and null for "No pack"', () => {
    const onChange = vi.fn();
    render(<ChannelVizPackPicker value="club-night" onChange={onChange} />);

    fireEvent.click(screen.getByRole('radio', { name: /Deep listening/ }));
    expect(onChange).toHaveBeenLastCalledWith('deep-listening');

    fireEvent.click(screen.getByRole('radio', { name: /No pack/ }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('does not change while the visualizer is off', () => {
    const onChange = vi.fn();
    render(<ChannelVizPackPicker value={null} onChange={onChange} disabled />);

    fireEvent.click(screen.getByRole('radio', { name: /Club night/ }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('ChannelVizPackLabel', () => {
  const packJson = '{"pack:chrome-drive":{}}';

  it('names the pack when the header runs the visualizer', () => {
    render(
      <ChannelVizPackLabel
        channel={{ visualSettingsJson: packJson, headerStyle: 'VIDEO_LOOP' }}
      />,
    );
    expect(screen.getByTestId('channel-viz-pack-label')).toHaveTextContent(
      'This show uses Chrome drive',
    );
  });

  it('stays hidden without a pack or behind a gradient header', () => {
    const { container, rerender } = render(
      <ChannelVizPackLabel
        channel={{ visualSettingsJson: '{"AURORA":{}}', headerStyle: 'X' }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
    rerender(
      <ChannelVizPackLabel
        channel={{ visualSettingsJson: packJson, headerStyle: 'GRADIENT' }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
