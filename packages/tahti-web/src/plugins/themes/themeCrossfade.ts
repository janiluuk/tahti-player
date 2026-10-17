export function withThemeVisualTransition(apply: () => void) {
  if (typeof window === 'undefined') {
    apply();
    return;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    apply();
    return;
  }
  const root = document.documentElement;
  root.classList.add('tahti-theme-crossfade-active');
  apply();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.classList.remove('tahti-theme-crossfade-active');
    });
  });
}
