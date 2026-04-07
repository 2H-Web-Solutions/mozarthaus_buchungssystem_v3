/**
 * Builds URL to the Regiondo dev proxy (`/api/regiondo/...`) or a custom base (`VITE_REGIONDO_PRODUCTS_API_URL`).
 */
export function buildRegiondoProxyUrl(subPath: string, searchParams: URLSearchParams): string {
  const custom = import.meta.env.VITE_REGIONDO_PRODUCTS_API_URL as string | undefined;
  if (!custom) {
    const u = new URL('/api/regiondo', window.location.origin);
    const qp = new URLSearchParams(searchParams);
    qp.set('path', subPath.replace(/^\/+|\/+$/g, ''));
    u.search = qp.toString();
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
