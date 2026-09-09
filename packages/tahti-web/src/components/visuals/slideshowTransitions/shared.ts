import * as THREE from 'three';

/** Ported from `../tahti-org/apps/web/src/components/gallery/shared.ts`
 * (trimmed to what the slideshow transitions need — the gallery-strip-only
 * helpers like `createGalleryRenderer`/`bindPointerUniforms` stayed behind). */
export function loadGalleryTextures(urls: string[]): {
  textures: Promise<THREE.Texture[]>;
  dispose: () => void;
} {
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  const loaded: THREE.Texture[] = [];
  let cancelled = false;

  const promise = Promise.all(
    urls.map(
      (url) =>
        new Promise<THREE.Texture>((resolve, reject) => {
          loader.load(
            url,
            (tex) => {
              if (cancelled) {
                tex.dispose();
                reject(new Error('cancelled'));
                return;
              }
              tex.colorSpace = THREE.SRGBColorSpace;
              loaded.push(tex);
              resolve(tex);
            },
            undefined,
            () => reject(new Error(`Failed to load ${url}`)),
          );
        }),
    ),
  ).catch(() => [] as THREE.Texture[]);

  return {
    textures: promise,
    dispose: () => {
      cancelled = true;
      for (const t of loaded) {
        t.dispose();
      }
    },
  };
}

export function textureAspect(texture: THREE.Texture): number {
  const img = texture.image as { width: number; height: number };
  return img.width / img.height;
}
