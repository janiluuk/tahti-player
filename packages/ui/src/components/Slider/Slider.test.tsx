import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import '@tahti-player/tailwind-config';

import { Slider } from '.';

describe('Slider (composed)', () => {
  it('renders header label and value', () => {
    render(
      <Slider defaultValue={25} unit="%">
        <Slider.Header label="Volume" />
        <Slider.Surface>
          <Slider.Track />
          <Slider.RangeInput />
        </Slider.Surface>
        <Slider.Footer />
      </Slider>,
    );
    expect(screen.getByText('Volume')).toBeInTheDocument();
    expect(screen.getByText('25 %')).toBeInTheDocument();
  });

  it('shows formatValue output in the header, footer and aria-valuetext', () => {
    render(
      <Slider
        label="Freq"
        value={500}
        min={0}
        max={1000}
        formatValue={(v) => `${v * 2} Hz`}
      />,
    );
    expect(screen.getByText('1000 Hz')).toBeInTheDocument();
    expect(screen.getByText('0 Hz')).toBeInTheDocument();
    expect(screen.getByText('2000 Hz')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toHaveAttribute(
      'aria-valuetext',
      '1000 Hz',
    );
  });

  it('calls onValueChange when moved via keyboard', async () => {
    const onChange = vi.fn();
    render(
      <Slider
        min={0}
        max={10}
        step={1}
        defaultValue={5}
        onValueChange={onChange}
      >
        <Slider.Header label="Size" />
        <Slider.Surface>
          <Slider.Track />
          <Slider.RangeInput />
        </Slider.Surface>
        <Slider.Footer />
      </Slider>,
    );

    const input = screen.getByRole('slider', { name: 'Size' });
    await userEvent.type(input, '{arrowright}');

    expect(onChange).toHaveBeenCalled();
  });

  it('increments and decrements on wheel and prevents page scroll', () => {
    const onChange = vi.fn();
    render(
      <Slider
        min={0}
        max={10}
        step={2}
        defaultValue={4}
        onValueChange={onChange}
      >
        <Slider.Header label="Zoom" />
        <Slider.Surface>
          <Slider.Track />
          <Slider.RangeInput />
        </Slider.Surface>
        <Slider.Footer />
      </Slider>,
    );

    const input = screen.getByRole('slider', { name: 'Zoom' });
    const wheelEvent = new WheelEvent('wheel', {
      deltaY: -100,
      bubbles: true,
      cancelable: true,
    });
    const preventSpy = vi.spyOn(wheelEvent, 'preventDefault');
    const stopSpy = vi.spyOn(wheelEvent, 'stopPropagation');
    act(() => {
      input.dispatchEvent(wheelEvent);
    });

    expect(onChange).toHaveBeenCalledWith(6);
    expect(preventSpy).toHaveBeenCalled();
    expect(stopSpy).toHaveBeenCalled();
  });

  it('clamps value at bounds', async () => {
    const onChange = vi.fn();
    render(
      <Slider
        min={0}
        max={5}
        step={1}
        defaultValue={0}
        onValueChange={onChange}
      >
        <Slider.Header label="Level" />
        <Slider.Surface>
          <Slider.Track />
          <Slider.RangeInput />
        </Slider.Surface>
        <Slider.Footer />
      </Slider>,
    );
    const input = screen.getByRole('slider', { name: 'Level' });
    await userEvent.type(input, '{arrowleft}');
    await userEvent.type(input, '{home}');
    expect(onChange).toHaveBeenCalledWith(0);

    onChange.mockClear();
    await userEvent.type(input, '{end}');
    await userEvent.type(input, '{arrowright}');
    expect(onChange).toHaveBeenLastCalledWith(5);
  });
});
