import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/mentions';
import { MentionTextarea } from './MentionTextarea';

function Harness() {
  const [value, setValue] = useState('');
  return (
    <MentionTextarea label="Tracklist" value={value} onChange={setValue} />
  );
}

describe('MentionTextarea', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows each suggestion's avatar and inserts the handle", async () => {
    vi.spyOn(api, 'searchMentionUsers').mockResolvedValue({
      data: [
        {
          username: 'selector',
          displayName: 'Selector',
          avatarUrl: 'https://cdn.example.com/selector.png',
        },
      ],
      meta: { source: 'api' },
    } as Awaited<ReturnType<typeof api.searchMentionUsers>>);
    const { container } = render(<Harness />);
    const textarea = screen.getByLabelText('Tracklist');
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'with @se' } });
    });
    const option = await screen.findByRole('button', { name: /Selector/ });
    expect(
      container.querySelector(
        'img[src="https://cdn.example.com/selector.png"]',
      ),
    ).toBeTruthy();
    fireEvent.click(option);
    expect((textarea as HTMLTextAreaElement).value).toBe('with @selector ');
  });
});
