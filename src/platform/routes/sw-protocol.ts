/**
 * What the venue page and its service worker agree on (D-13). Kept apart from venue-sw.ts so the
 * page's bundle carries these three constants, not the worker's source.
 */

/** Message the page posts to have the worker store what it has already loaded. */
export const SW_WARM_MESSAGE = "kartela:isit";
/** Header the worker adds to a stored page: when it was stored (ISO instant). */
export const SW_STORED_AT_HEADER = "x-kartela-saklandi";
/** Image CDNs of the custom loader (K-16); the only cross-origin requests the worker handles. */
export const SW_IMAGE_HOSTS = ["images.unsplash.com", "images.pexels.com"] as const;
