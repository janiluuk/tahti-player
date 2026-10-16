import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImageLightbox } from '@tahti-web/components/ImageLightbox';
import { useState } from 'react';

const gallery = [
  {
    imageUrl: 'https://picsum.photos/seed/lightbox1/1200/800',
    title: 'Studio session',
  },
  {
    imageUrl: 'https://picsum.photos/seed/lightbox2/1200/800',
    title: 'Live at Tavastia',
  },
  { imageUrl: 'https://picsum.photos/seed/lightbox3/1200/800', title: null },
];

const meta: Meta<typeof ImageLightbox> = {
  title: 'Tahti/Media/ImageLightbox',
  component: ImageLightbox,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Full-screen gallery viewer on Dialog. Untitled captions are covered in MultipleImages.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleImage: Story = {
  args: {
    images: [gallery[0]!],
    index: 0,
    label: 'Photo viewer',
    onClose: () => {},
  },
};

/** Interactive: arrow buttons / arrow keys advance through the gallery. */
export const MultipleImages: Story = {
  render: () => {
    function Controlled() {
      const [index, setIndex] = useState(0);
      return (
        <ImageLightbox
          images={gallery}
          index={index}
          label="Gallery slideshow"
          onIndexChange={setIndex}
          onClose={() => {}}
        />
      );
    }
    return <Controlled />;
  },
};

export const EmptyGallery: Story = {
  args: {
    images: [],
    index: 0,
    label: 'Photo viewer',
    onClose: () => {},
  },
};
