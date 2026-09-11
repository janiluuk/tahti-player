/** Whether this browser can actually create a WebGL context — false on GPUs/
 * sandboxes that refuse context creation (some VMs, disabled hardware
 * acceleration, certain locked-down corporate browsers), where mounting a
 * Three.js renderer would throw instead of rendering nothing. */
export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
