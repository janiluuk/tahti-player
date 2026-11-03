/** MIME types accepted by `/api/me/media` prepare + complete. */
const IMAGE_UPLOAD_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type ImageUploadContentType =
  (typeof IMAGE_UPLOAD_CONTENT_TYPES)[number];

const IMAGE_UPLOAD_ACCEPT = IMAGE_UPLOAD_CONTENT_TYPES.join(',');

/** File input `accept` for image uploads that hit user-media. */
export const IMAGE_UPLOAD_ACCEPT_ATTR = IMAGE_UPLOAD_ACCEPT;

/**
 * Resolve a content type the media API will accept.
 * Browsers often leave `file.type` empty or use `image/jpg`; guessing
 * `image/png` for those cases makes prepare/complete succeed while the
 * uploaded bytes do not match, so the cover never renders.
 */
export function resolveImageUploadContentType(
  file: File,
): ImageUploadContentType | null {
  const fromType = file.type.trim().toLowerCase();
  if (fromType === 'image/jpg' || fromType === 'image/jpeg') {
    return 'image/jpeg';
  }
  if (fromType === 'image/png' || fromType === 'image/webp') {
    return fromType;
  }

  const name = file.name.trim().toLowerCase();
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (name.endsWith('.png')) {
    return 'image/png';
  }
  if (name.endsWith('.webp')) {
    return 'image/webp';
  }

  return null;
}

export function imageUploadTypeError(file: File): string {
  const hint = file.name ? ` (“${file.name}”)` : '';
  return `Use a JPEG, PNG, or WebP image${hint}. SVG, GIF, and HEIC are not supported.`;
}
