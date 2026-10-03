import { expect, userEvent, waitFor } from 'storybook/test';

/**
 * Clicks a track table row's play button. On pointer devices the button is
 * `visibility: hidden` until CSS :hover, which synthetic events can't
 * trigger, and hidden elements have no accessible name for role queries,
 * so it is found by its aria-label attribute instead.
 */
export async function clickRowPlay(container: HTMLElement, title: string) {
  const selector = `button[aria-label="Play ${CSS.escape(title)}"]`;
  await waitFor(() => expect(container.querySelector(selector)).not.toBeNull());
  await userEvent.click(container.querySelector(selector)!);
}
