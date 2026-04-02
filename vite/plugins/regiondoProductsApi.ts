import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, PreviewServer, ViteDevServer } from 'vite';
import { createHmac } from 'node:crypto';

const REGIONDO_HOST = 'https://api.regiondo.com';

function signRegiondo(
  publicKey: string,
  privateKey: string,
  queryString: string
): { timestamp: string; hash: string } {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const stringToHash = timestamp + publicKey + queryString;
  const hash = createHmac('sha256', privateKey).update(stringToHash).digest('hex');
  return { timestamp, hash };
}

/**
 * Maps `/api/regiondo/<path>` → `https://api.regiondo.com/v1/<path>`
 * (e.g. `products`, `products/availabilities/:id`, `supplier/bookings`).
 */
function regiondoPathFromApiPath(pathname: string): string | null {
  const prefix = '/api/regiondo/';
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length).replace(/^\/+|\/+$/g, '');
  if (!rest) return null;
  if (rest === 'products') return '/v1/products';
  return `/v1/${rest}`;
}

type NextFn = (err?: unknown) => void;

function regiondoProxyMiddleware(publicKey: string, privateKey: string) {
  return async (req: IncomingMessage, res: ServerResponse, next: NextFn) => {
    if (!req.url?.startsWith('/api/regiondo/')) {
      next();
      return;
    }

    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    try {
      const incoming = new URL(req.url, 'http://localhost');
      const path = regiondoPathFromApiPath(incoming.pathname);
      if (!path) {
        next();
        return;
      }

      const forward = new URLSearchParams(incoming.search);
      const queryString = forward.toString();
      const regiondoUrl = queryString ? `${REGIONDO_HOST}${path}?${queryString}` : `${REGIONDO_HOST}${path}`;

      const { timestamp, hash } = signRegiondo(publicKey, privateKey, queryString);

      const r = await fetch(regiondoUrl, {
        headers: {
          'X-API-ID': publicKey,
          'X-API-TIME': timestamp,
          'X-API-HASH': hash,
          'Accept-Language': forward.get('store_locale') || 'de-AT',
          Accept: 'application/json',
        },
      });

      const text = await r.text();
      res.statusCode = r.status;
      res.setHeader('Content-Type', r.headers.get('content-type') || 'application/json');
      res.end(text);
    } catch (e) {
      console.error('[regiondo-api]', e);
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Regiondo proxy request failed' }));
    }
  };
}

function attachMiddleware(server: ViteDevServer | PreviewServer, publicKey: string, privateKey: string) {
  server.middlewares.use(regiondoProxyMiddleware(publicKey, privateKey));
}

function missingKeysMiddleware() {
  return (req: IncomingMessage, res: ServerResponse, next: NextFn) => {
    if (req.url?.startsWith('/api/regiondo/')) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error:
            'Regiondo API keys not configured. Set REGIONDO_PUBLIC_KEY and REGIONDO_PRIVATE_KEY in .env (not VITE_).',
        })
      );
      return;
    }
    next();
  };
}

export function regiondoProductsApiPlugin(env: Record<string, string>): Plugin {
  const publicKey = env.REGIONDO_PUBLIC_KEY || '';
  const privateKey = env.REGIONDO_PRIVATE_KEY || '';

  return {
    name: 'regiondo-products-api',
    configureServer(server) {
      if (!publicKey || !privateKey) {
        console.warn(
          '[regiondo-api] REGIONDO_PUBLIC_KEY / REGIONDO_PRIVATE_KEY missing — /api/regiondo/* will return 503.'
        );
        server.middlewares.use(missingKeysMiddleware());
        return;
      }
      attachMiddleware(server, publicKey, privateKey);
    },
    configurePreviewServer(server) {
      if (!publicKey || !privateKey) {
        server.middlewares.use(missingKeysMiddleware());
        return;
      }
      attachMiddleware(server, publicKey, privateKey);
    },
  };
}
