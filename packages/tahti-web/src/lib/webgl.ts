type WebGLProbe = { supported: boolean; software: boolean };

const SOFTWARE_RENDERER =
  /swiftshader|llvmpipe|softpipe|lavapipe|software|basic render driver/i;

let probe: WebGLProbe | null = null;

function rendererName(gl: WebGLRenderingContext): string {
  try {
    const names = [String(gl.getParameter(gl.RENDERER) ?? '')];
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    if (debug) {
      names.push(String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) ?? ''));
    }
    return names.join(' ');
  } catch {
    return '';
  }
}

/** Probed once per page: every probe creates a context, and browsers cap how
 * many may be alive at a time. */
function probeWebGL(): WebGLProbe {
  if (probe) {
    return probe;
  }
  let gl: WebGLRenderingContext | null;
  try {
    const canvas = document.createElement('canvas');
    gl = (canvas.getContext('webgl2') ??
      canvas.getContext('webgl')) as WebGLRenderingContext | null;
  } catch {
    gl = null;
  }
  if (!gl) {
    probe = { supported: false, software: false };
    return probe;
  }
  probe = {
    supported: true,
    software: SOFTWARE_RENDERER.test(rendererName(gl)),
  };
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return probe;
}

/** Whether this browser can actually create a WebGL context — false on GPUs/
 * sandboxes that refuse context creation (some VMs, disabled hardware
 * acceleration, certain locked-down corporate browsers), where mounting a
 * Three.js renderer would throw instead of rendering nothing. */
export function supportsWebGL(): boolean {
  return probeWebGL().supported;
}

/** WebGL runs on the CPU (SwiftShader, llvmpipe and friends), as it does when
 * hardware acceleration is off. A full-window scene then costs whole frames. */
export function hasSoftwareWebGL(): boolean {
  return probeWebGL().software;
}

export function resetWebGLProbeForTests(): void {
  probe = null;
}
