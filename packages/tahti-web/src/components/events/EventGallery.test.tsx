import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { EventGallery } from './EventGallery';

const images = [
  { url: 'https://cdn.example/1.jpg', caption: 'Doors open' },
  { url: 'https://cdn.example/2.jpg', caption: '' },
  { url: 'https://cdn.example/3.jpg', caption: 'Encore' },
];

describe('EventGallery', () => {
  afterEach(() => cleanup());

  it('renders nothing without images', () => {
    const { container } = render(
      <EventGallery images={[]} title="Show" seed="evt-1" />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows thumbnails with captions as visible text and alt text', () => {
    render(<EventGallery images={images} title="Show" seed="evt-1" />);
    expect(screen.getByRole('heading', { name: 'Photo gallery' })).toBeTruthy();
    expect(screen.getByText('Doors open')).toBeTruthy();
    expect(screen.getByText('Encore')).toBeTruthy();
    expect(screen.getByAltText('Doors open')).toBeTruthy();
    expect(screen.getByAltText('Show, image 2')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Open image 2 of 3' }),
    ).toBeTruthy();
  });

  it('opens the slideshow at the clicked image', () => {
    render(<EventGallery images={images} title="Show" seed="evt-1" />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Open image 3 of 3: Encore' }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Photos from Show' });
    const caption = dialog.querySelector('figcaption')?.textContent ?? '';
    expect(caption).toContain('Encore');
    expect(caption).toContain('3 / 3');
    fireEvent.click(screen.getByRole('button', { name: 'Close image viewer' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
