export const MAX_MEDIA_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const COMPRESSED_IMAGE_QUALITY = 0.78;
const COMPRESSED_IMAGE_TYPE = 'image/webp';

export function formatMediaSize(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

export async function prepareImageForUpload(file: File): Promise<File> {
  if (!isCompressibleImage(file) || !canCompressImagesInBrowser()) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const size = fitWithin(bitmap.width, bitmap.height, MAX_IMAGE_DIMENSION);

  if (file.size <= MAX_MEDIA_UPLOAD_BYTES && size.width === bitmap.width && size.height === bitmap.height) {
    bitmap.close?.();
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');

  if (!context) {
    bitmap.close?.();
    return file;
  }

  context.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close?.();

  const blob = await canvasToBlob(canvas, COMPRESSED_IMAGE_TYPE, COMPRESSED_IMAGE_QUALITY);
  if (!blob) {
    return file;
  }

  const compressed = new File([blob], replaceExtension(file.name, blob.type === COMPRESSED_IMAGE_TYPE ? 'webp' : 'jpg'), {
    type: blob.type || COMPRESSED_IMAGE_TYPE,
    lastModified: Date.now(),
  });

  if (compressed.size >= file.size && file.size <= MAX_MEDIA_UPLOAD_BYTES) {
    return file;
  }

  return compressed;
}

function isCompressibleImage(file: File) {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
}

function canCompressImagesInBrowser() {
  return typeof document !== 'undefined' && typeof createImageBitmap === 'function';
}

function fitWithin(width: number, height: number, maxDimension: number) {
  const largest = Math.max(width, height);
  if (largest <= maxDimension) {
    return { width, height };
  }

  const scale = maxDimension / largest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

function replaceExtension(filename: string, extension: string) {
  const base = filename.replace(/\.[^.]+$/, '') || 'image';
  return `${base}.${extension}`;
}
