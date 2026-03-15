const API_BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';

/**
 * Returns the URL to use in an <img src>:
 * - data: URIs → returned as-is (base64, no proxy needed)
 * - http/https external URLs → routed through /api/proxy-image
 *   This bypasses Cross-Origin-Resource-Policy: same-site headers
 *   sent by Google and other CDNs that would otherwise block the image.
 */
export function imgSrc(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `${API_BASE}/proxy-image?url=${encodeURIComponent(url)}`;
  }
  return url;
}
