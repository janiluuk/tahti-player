// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { OverflowPingPongText } from './OverflowPingPongText';

let clientWidthDescriptor: PropertyDescriptor | undefined;
let scrollWidthDescriptor: PropertyDescriptor | undefined;

beforeEach(() => {
  clientWidthDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'clientWidth',
  );
  scrollWidthDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'scrollWidth',
  );
});

afterEach(() => {
  cleanup();
  if (clientWidthDescriptor) {
    Object.defineProperty(
      HTMLElement.prototype,
      'clientWidth',
      clientWidthDescriptor,
    );
  }
  if (scrollWidthDescriptor) {
    Object.defineProperty(
      HTMLElement.prototype,
      'scrollWidth',
      scrollWidthDescriptor,
    );
  }
});

function widths(viewport: number, track: number) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get() {
      return this.classList.contains('tahti-ping-pong') ? viewport : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
    configurable: true,
    get() {
      return this.classList.contains('tahti-ping-pong-track') ? track : 0;
    },
  });
}

describe('OverflowPingPongText', () => {
  it('sets the exact travel distance when the name overflows', () => {
    widths(180, 288);
    render(
      <OverflowPingPongText as="h1" testId="name">
        A deliberately long track name
      </OverflowPingPongText>,
    );
    const viewport = screen.getByTestId('name');
    const track = viewport.firstElementChild as HTMLElement;
    expect(viewport).toHaveAttribute('data-overflow', 'true');
    expect(track.style.getPropertyValue('--tahti-ping-pong-distance')).toBe(
      '-108px',
    );
  });

  it('stays still when the name fits', () => {
    widths(288, 180);
    render(
      <OverflowPingPongText testId="name">Short name</OverflowPingPongText>,
    );
    const viewport = screen.getByTestId('name');
    expect(viewport).not.toHaveAttribute('data-overflow');
    expect(viewport.firstElementChild).not.toHaveAttribute('style');
  });
});
