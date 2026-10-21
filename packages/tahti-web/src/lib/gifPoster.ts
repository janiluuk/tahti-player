/** A still PNG of an animated image's first frame. `createImageBitmap`
 * decodes only the first frame of a GIF, which is the frame the profile
 * shows at rest. Rejects when the browser cannot decode the file. */
export async function firstFramePng(file: Blob): Promise<Blob> {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('This browser cannot read animated images');
  }
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not draw the first frame');
    }
    context.drawImage(bitmap, 0, 0);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error('Could not draw the first frame')),
        'image/png',
      );
    });
  } finally {
    bitmap.close();
  }
}
