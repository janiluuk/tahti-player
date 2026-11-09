import type { ReactNode } from 'react';

import { Button } from '@tahti-player/ui';

/** A `StoryCard` title that opens the same reader as the card image. */
export function StoryTitleButton({
  onOpen,
  children,
}: {
  onOpen: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      variant="text"
      size="flexible"
      className="h-auto justify-start p-0 text-left whitespace-normal text-inherit hover:bg-transparent hover:underline active:scale-100"
      onClick={onOpen}
    >
      {children}
    </Button>
  );
}
