import { expect, userEvent, waitFor, within } from 'storybook/test';

type Scope = ReturnType<typeof within>;
type Name = string | RegExp;

/**
 * Queries scoped to the whole document body. Dialogs, popovers, menus and
 * toasts portal out of the story canvas, so `within(canvasElement)` can't
 * see them.
 */
export function withinBody(canvasElement: HTMLElement): Scope {
  return within(canvasElement.ownerDocument.body);
}

/** Waits for an open dialog (optionally by accessible name) and scopes to it. */
export async function findDialog(
  canvasElement: HTMLElement,
  name?: Name,
): Promise<Scope> {
  const dialog = await withinBody(canvasElement).findByRole(
    'dialog',
    name === undefined ? undefined : { name },
  );
  await expect(dialog).toBeVisible();
  return within(dialog);
}

/** Clicks the button named `trigger` and returns the dialog it opens. */
export async function openDialog(
  canvasElement: HTMLElement,
  trigger: Name,
  dialogName?: Name,
): Promise<Scope> {
  await userEvent.click(
    within(canvasElement).getByRole('button', { name: trigger }),
  );
  return findDialog(canvasElement, dialogName);
}

/** Waits until no dialog is left open (exit animations included). */
export async function expectNoDialog(canvasElement: HTMLElement) {
  await waitFor(() =>
    expect(withinBody(canvasElement).queryByRole('dialog')).toBeNull(),
  );
}

/** Selects a tab by name in `scope` and waits for it to become active. */
export async function selectTab(scope: Scope, name: Name) {
  const tab = scope.getByRole('tab', { name });
  await userEvent.click(tab);
  await waitFor(() => expect(tab).toHaveAttribute('aria-selected', 'true'));
  return tab;
}

/** Waits for a toast (sonner or the app's own) containing `text`. */
export async function findToast(canvasElement: HTMLElement, text: Name) {
  const toast = await withinBody(canvasElement).findByText(text);
  await expect(toast).toBeVisible();
  return toast;
}
