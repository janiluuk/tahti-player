export class UploadAbortedError extends Error {
  constructor() {
    super('Upload cancelled');
    this.name = 'UploadAbortedError';
  }
}

/** PUT a file to a presigned URL, reporting progress as 0-1. `fetch` has no
 * upload progress events, so this uses XMLHttpRequest. Rejects with
 * `UploadAbortedError` when `signal` aborts. */
export function putWithProgress(
  url: string,
  file: Blob,
  options: {
    contentType: string;
    onProgress?: (fraction: number) => void;
    signal?: AbortSignal;
  },
): Promise<void> {
  const { contentType, onProgress, signal } = options;
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new UploadAbortedError());
      return;
    }
    const xhr = new XMLHttpRequest();
    const onAbort = () => xhr.abort();
    const cleanup = () => signal?.removeEventListener('abort', onAbort);
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(event.loaded / event.total);
      }
    };
    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => {
      cleanup();
      reject(new Error('Upload failed - check your connection'));
    };
    xhr.onabort = () => {
      cleanup();
      reject(new UploadAbortedError());
    };
    signal?.addEventListener('abort', onAbort);
    xhr.send(file);
  });
}
