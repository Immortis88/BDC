// Empty in development so Vite can proxy requests to the local backend.
const backendOrigin = (import.meta.env?.VITE_API_URL || '').replace(/\/+$/, '');

export function backendUrl(path) {
  return /^\/(?:api|media)(?:\/|\?|$)/.test(path)
    ? `${backendOrigin}${path}`
    : path;
}

// API responses include nested CMS, gallery and upload media URLs.
// Keep frontend /assets paths and third-party URLs unchanged.
export function resolveMediaUrls(value) {
  if (typeof value === 'string') {
    return value.startsWith('/media/') ? backendUrl(value) : value;
  }
  if (Array.isArray(value)) return value.map(resolveMediaUrls);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveMediaUrls(item)]));
  }
  return value;
}
