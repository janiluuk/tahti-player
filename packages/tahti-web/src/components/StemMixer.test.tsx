import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StemMixer } from './StemMixer';

const files = [
  { label: 'Vocals', url: '/stems/vocals.mp3' },
  { label: 'Drums', url: '/stems/drums.mp3' },
  { label: 'Bass', url: '/stems/bass.mp3' },
];

const volumes = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('audio')).map((el) => el.volume);

describe('StemMixer', () => {
  it('applies mute and solo to each stem while it plays', () => {
    const { container } = render(<StemMixer files={files} />);
    expect(volumes(container)).toEqual([1, 1, 1]);

    fireEvent.click(screen.getByRole('button', { name: 'Mute Drums' }));
    expect(volumes(container)).toEqual([1, 0, 1]);

    fireEvent.click(screen.getByRole('button', { name: 'Solo Bass' }));
    expect(volumes(container)).toEqual([0, 0, 1]);

    fireEvent.click(screen.getByRole('button', { name: 'Reset stem mix' }));
    expect(volumes(container)).toEqual([1, 1, 1]);
  });

  it('shift-click solo leaves only that stem soloed', () => {
    const { container } = render(<StemMixer files={files} />);
    fireEvent.click(screen.getByRole('button', { name: 'Solo Vocals' }));
    fireEvent.click(screen.getByRole('button', { name: 'Solo Drums' }), {
      shiftKey: true,
    });
    expect(volumes(container)).toEqual([0, 1, 0]);
    expect(screen.getByRole('button', { name: 'Solo Vocals' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('scales a stem by its level fader', () => {
    const { container } = render(<StemMixer files={files} />);
    fireEvent.change(screen.getByLabelText('Bass level'), {
      target: { value: '25' },
    });
    expect(volumes(container)).toEqual([1, 1, 0.25]);
  });
});
