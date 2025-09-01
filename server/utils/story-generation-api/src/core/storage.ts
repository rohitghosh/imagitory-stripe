import fetch from "node-fetch";
import { uploadBase64ToFirebase } from "../../../uploadImage";

/**
 * Download image from URL and convert to base64
 */
export async function downloadAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}: ${response.status}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  
  // Try to get MIME type from response headers, fallback to guessing from URL
  let mimeType = response.headers.get('content-type') || inferMimeFromUrl(url);
  
  return { base64, mimeType };
}

/**
 * Convert URL to data URL format
 */
export async function toDataUrl(url: string): Promise<string> {
  const { base64, mimeType } = await downloadAsBase64(url);
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Save buffer to Firebase Storage and return storage info
 */
export async function saveBufferToStorage(
  buffer: Buffer, 
  extension: string,
  storagePath?: string
): Promise<{ storagePath: string; url: string }> {
  const base64 = buffer.toString('base64');
  const finalPath = storagePath || `generated_images/${Date.now()}.${extension}`;
  
  const url = await uploadBase64ToFirebase(base64, finalPath);
  
  return {
    storagePath: finalPath,
    url
  };
}

/**
 * Infer MIME type from URL extension
 */
export function inferMimeFromUrl(url: string): string {
  const extension = url.toLowerCase().split('.').pop() || '';
  
  switch (extension) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/png'; // default fallback
  }
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMime(mimeType: string): string {
  const type = mimeType.toLowerCase();
  
  if (type.includes('png')) return 'png';
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';
  if (type.includes('webp')) return 'webp';
  if (type.includes('gif')) return 'gif';
  
  return 'png'; // default fallback
}
