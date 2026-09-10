export interface SlideshowTransitionProps {
  fromUrl: string;
  toUrl: string;
  durationMs: number;
  /** Called exactly once, when the transition finishes animating. */
  onComplete: () => void;
}
