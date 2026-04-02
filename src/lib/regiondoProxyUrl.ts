/**
 * Builds URL to the Regiondo dev proxy (`/api/regiondo/...`) or a custom base (`VITE_REGIONDO_PRODUCTS_API_URL`).
 */
export function buildRegiondoProxyUrl(subPath: string, searchParams: URLSearchParams): string {
  const custom = import.meta.env.VITE_REGIONDO_PRODUCTS_API_URL as string | undefined;
  if (!custom) {
    const u = new URL(`/api/regiondo/${subPath}`, window.location.origin);
    u.search = searchParams.toString();
    return u.toString();
  }
  const u = new URL(custom);
  if (subPath === 'products') {
    u.search = searchParams.toString();
    return u.toString();
  }
  u.pathname = u.pathname.replace(/\/products\/?$/, '') + '/' + subPath;
  u.search = searchParams.toString();
  return u.toString();
}
