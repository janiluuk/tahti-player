import { ButtonAnchor } from '@tahti-player/ui';

export const MAIN_CONTENT_ID = 'main-content';

export function SkipToContent() {
  return (
    <ButtonAnchor
      href={`#${MAIN_CONTENT_ID}`}
      size="sm"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:h-9 focus:px-3"
      onClick={(event) => {
        const target = document.getElementById(MAIN_CONTENT_ID);
        if (target) {
          event.preventDefault();
          target.focus();
        }
      }}
    >
      Skip to content
    </ButtonAnchor>
  );
}
