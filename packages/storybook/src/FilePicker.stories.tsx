import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';

import { Button, FilePicker, HiddenFileInput } from '@tahti-player/ui';

const meta = {
  title: 'Components/FilePicker',
  component: FilePicker,
  tags: ['autodocs'],
} satisfies Meta<typeof FilePicker>;

export default meta;
type Story = StoryObj<typeof FilePicker>;

export const AllStates: Story = {
  render: () => {
    const [audioFiles, setAudioFiles] = useState<readonly File[]>([]);
    return (
      <div className="flex max-w-xl flex-col gap-4">
        <FilePicker
          labels={{
            title: 'Audio file',
            description: 'MP3, WAV, FLAC, or AIFF',
            browse: 'Choose audio',
          }}
          accept="audio/*"
          selectedFiles={audioFiles}
          onFiles={setAudioFiles}
        />
        <FilePicker
          labels={{
            title: 'Cover artwork',
            description: 'JPEG, PNG, or WebP',
            browse: 'Choose image',
          }}
          accept="image/*"
          selectedFiles={[new File(['cover'], 'cover.webp')]}
        />
        <FilePicker
          labels={{
            title: 'Audio file',
            description: 'Upload is in progress',
            browse: 'Choose audio',
          }}
          disabled
        />
      </div>
    );
  },
};

export const RetryAfterUploadError: Story = {
  render: () => {
    const [selectedFiles, setSelectedFiles] = useState<readonly File[]>([]);
    const [message, setMessage] = useState('');

    return (
      <div className="flex max-w-xl flex-col gap-3">
        <FilePicker
          labels={{
            title: 'Cover artwork',
            description: 'The same file can be selected again after an error.',
            browse: 'Choose image',
          }}
          accept="image/*"
          selectedFiles={selectedFiles}
          onFiles={(files) => {
            setSelectedFiles(files);
            setMessage(
              files[0] ? `Selected ${files[0].name}` : 'No file selected',
            );
          }}
        />
        <p className="text-foreground-secondary text-xs" role="status">
          {message || 'Select an image to verify the retryable input behavior.'}
        </p>
      </div>
    );
  },
};

/** `HiddenFileInput` behind a custom control: the button opens the OS
 * picker through the input's ref. */
export const HiddenInputBehindButton: Story = {
  render: () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [names, setNames] = useState<string[]>([]);
    return (
      <div className="flex flex-col items-start gap-2">
        <Button variant="secondary" onClick={() => inputRef.current?.click()}>
          Choose images
        </Button>
        <HiddenFileInput
          ref={inputRef}
          accept="image/*"
          multiple
          onFiles={(files) => setNames(files.map((file) => file.name))}
        />
        <p className="text-foreground-secondary text-xs">
          {names.length > 0 ? names.join(', ') : 'Nothing chosen yet.'}
        </p>
      </div>
    );
  },
};
