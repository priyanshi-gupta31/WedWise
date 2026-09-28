/**
 * WEDWISE — Phase 9.5 Client-Side Image Processing & Compression Pipeline
 *
 * Designed specifically for high-fidelity Indian wedding photography:
 * 1. Native EXIF orientation handling (prevents rotated mobile captures)
 * 2. Proportional downscaling without upscaling
 * 3. High-efficiency WebP compression
 * 4. Dual-rendition output: Full Archival Photo + Fast Loading Thumbnail
 *
 * SPECIFICATIONS:
 * - Full photo max edge: 2048px @ 0.85 quality (WebP)
 * - Thumbnail max edge: 640px @ 0.78 quality (WebP)
 * - Maximum file size accepted: 25 MB
 */

export interface ProcessedImageResult {
  fullBlob: Blob;
  fullWidth: number;
  fullHeight: number;
  fullSize: number;
  fullMimeType: string;
  thumbBlob: Blob;
  thumbWidth: number;
  thumbHeight: number;
  thumbSize: number;
  thumbMimeType: string;
}

export const MAX_RAW_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
export const MAX_FULL_DIMENSION = 2048; // Max longest edge for full image
export const FULL_WEBP_QUALITY = 0.85; // High visual fidelity for fabrics, jewelry & mandap lighting
export const MAX_THUMB_DIMENSION = 640; // Suggested 480-720px range
export const THUMB_WEBP_QUALITY = 0.78; // Lightweight for rapid mobile feed rendering

export const ALLOWED_PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
export const ALLOWED_PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

/**
 * Validates selected file before any processing begins.
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  // 1. File size check
  if (file.size > MAX_RAW_FILE_SIZE) {
    const sizeMb = Math.round(file.size / (1024 * 1024));
    return {
      valid: false,
      error: `Photo "${file.name}" (${sizeMb} MB) exceeds the 25 MB size limit. Please choose a smaller photo.`,
    };
  }

  // 2. MIME type & extension check
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
  const isMimeValid = ALLOWED_PHOTO_MIME_TYPES.includes(file.type.toLowerCase()) || file.type.startsWith('image/');
  const isExtValid = ALLOWED_PHOTO_EXTENSIONS.includes(ext);

  if (!isMimeValid && !isExtValid) {
    return {
      valid: false,
      error: `"${file.name}" is not a supported photo format. Please select JPEG, PNG, WebP, or HEIC images.`,
    };
  }

  return { valid: true };
}

/**
 * Calculates proportional target dimensions preserving aspect ratio without upscaling.
 */
export function calculateTargetDimensions(
  origWidth: number,
  origHeight: number,
  maxDimension: number
): { targetWidth: number; targetHeight: number } {
  if (origWidth <= 0 || origHeight <= 0) {
    return { targetWidth: maxDimension, targetHeight: maxDimension };
  }

  // Do not upscale if both dimensions are within max limit
  if (origWidth <= maxDimension && origHeight <= maxDimension) {
    return { targetWidth: origWidth, targetHeight: origHeight };
  }

  const ratio = Math.min(maxDimension / origWidth, maxDimension / origHeight);
  return {
    targetWidth: Math.max(1, Math.round(origWidth * ratio)),
    targetHeight: Math.max(1, Math.round(origHeight * ratio)),
  };
}

/**
 * Decodes an image file into an ImageBitmap or HTMLImageElement.
 * Modern browsers automatically handle EXIF orientation during decode.
 */
async function decodeImageSource(file: File | Blob): Promise<{
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  close: () => void;
}> {
  // 1. Attempt createImageBitmap with orientation normalization if supported
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      const bitmap = await window.createImageBitmap(file, {
        imageOrientation: 'from-image',
      } as ImageBitmapOptions);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // Fall through to HTMLImageElement fallback (e.g. for certain HEIC or SVG edge cases)
    }
  }

  // 2. Fallback to HTMLImageElement
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          source: img,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          close: () => {},
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Could not decode image "${file instanceof File ? file.name : 'photo'}". The file may be corrupted.`));
      };

      img.src = objectUrl;
    });
  }

  throw new Error('Image decoding requires a browser or canvas environment.');
}

/**
 * Renders a source image onto a canvas and converts it to a compressed WebP Blob.
 */
async function renderToWebpBlob(
  source: ImageBitmap | HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  quality: number
): Promise<{ blob: Blob; mimeType: string }> {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('Failed to obtain canvas 2D rendering context.');
  }

  // High quality interpolation
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw source image onto canvas
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

  // Convert to WebP blob (fallback to JPEG if browser does not support WebP encoding)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (webpBlob) => {
        if (webpBlob && webpBlob.size > 0) {
          resolve({ blob: webpBlob, mimeType: 'image/webp' });
        } else {
          // Fallback to JPEG
          canvas.toBlob(
            (jpegBlob) => {
              if (jpegBlob && jpegBlob.size > 0) {
                resolve({ blob: jpegBlob, mimeType: 'image/jpeg' });
              } else {
                reject(new Error('Failed to encode canvas image to compressed format.'));
              }
            },
            'image/jpeg',
            quality
          );
        }
      },
      'image/webp',
      quality
    );
  });
}

/**
 * Main Client-Side Image Processing Function.
 *
 * Takes a raw uploaded wedding photo (from camera, gallery or desktop file picker)
 * and generates:
 * 1. Full-resolution WebP image (max 2048px, quality 0.85)
 * 2. Mobile-optimized WebP thumbnail (max 640px, quality 0.78)
 */
export async function processWeddingPhoto(file: File): Promise<ProcessedImageResult> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid photo file.');
  }

  const decoded = await decodeImageSource(file);

  try {
    const origWidth = decoded.width;
    const origHeight = decoded.height;

    // 1. Calculate Full photo dimensions
    const fullDims = calculateTargetDimensions(origWidth, origHeight, MAX_FULL_DIMENSION);
    const fullOutput = await renderToWebpBlob(
      decoded.source,
      fullDims.targetWidth,
      fullDims.targetHeight,
      FULL_WEBP_QUALITY
    );

    // 2. Calculate Thumbnail dimensions
    const thumbDims = calculateTargetDimensions(origWidth, origHeight, MAX_THUMB_DIMENSION);
    const thumbOutput = await renderToWebpBlob(
      decoded.source,
      thumbDims.targetWidth,
      thumbDims.targetHeight,
      THUMB_WEBP_QUALITY
    );

    return {
      fullBlob: fullOutput.blob,
      fullWidth: fullDims.targetWidth,
      fullHeight: fullDims.targetHeight,
      fullSize: fullOutput.blob.size,
      fullMimeType: fullOutput.mimeType,
      thumbBlob: thumbOutput.blob,
      thumbWidth: thumbDims.targetWidth,
      thumbHeight: thumbDims.targetHeight,
      thumbSize: thumbOutput.blob.size,
      thumbMimeType: thumbOutput.mimeType,
    };
  } finally {
    decoded.close();
  }
}
