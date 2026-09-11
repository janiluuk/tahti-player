export type TahtiNativeCapabilities = {
  localLibrary: boolean;
};

declare global {
  var __TAHTI_NATIVE_CAPABILITIES__: TahtiNativeCapabilities | undefined;
}

export function getNativeCapabilities(): TahtiNativeCapabilities {
  return globalThis.__TAHTI_NATIVE_CAPABILITIES__ ?? { localLibrary: false };
}

export function hasNativePlayer(): boolean {
  return getNativeCapabilities().localLibrary;
}
