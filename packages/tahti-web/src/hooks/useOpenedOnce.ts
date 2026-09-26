import { useState } from 'react';

/**
 * True from the first render where `open` is true onwards. Lets a lazily
 * loaded dialog stay mounted after closing so its exit transition still runs.
 */
export function useOpenedOnce(open: boolean): boolean {
  const [opened, setOpened] = useState(open);
  if (open && !opened) {
    setOpened(true);
  }
  return opened || open;
}
