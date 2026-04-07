const { createHmac } = require('crypto');

const DEFAULT_REGIONDO_HOST = 'https://api.regiondo.com';
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

function normalizeHost(raw) {
  const t = String(raw || '').trim().replace(/\/+$/, '');
  if (!t) return DEFAULT_REGIONDO_HOST;
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  return `https://${t}`;
}

function normalizeSecret(raw) {
  return String(raw || '').trim();
}

function sanitizeForwardQuery(rawQuery) {
  const inParams = new URLSearchParams(rawQuery || '');
  const outParams = new URLSearchParams();
  for (const [k, v] of inParams.entries()) {
    if (k === '__debug' || k === 'path' || k === '...path') continue;
    outParams.append(k, v);
  }
  return outParams.toString();
}

function sign(publicKey, privateKey, queryString) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = timestamp + publicKey + queryString;
  const hash = createHmac('sha256', privateKey).update(payload).digest('hex');
  return { timestamp, hash };
}

function productIdFromSubPath(subPath) {
  const m = String(subPath || '').match(/^products\/([^/?#]+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  try {
    const method = req && req.method ? req.method : '';
    if (!ALLOWED_METHODS.has(method)) {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const publicKey = normalizeSecret(process.env.REGIONDO_PUBLIC_KEY || process.env.VITE_REGIONDO_PUBLIC_KEY);
    const privateKey = normalizeSecret(process.env.REGIONDO_PRIVATE_KEY || process.env.VITE_REGIONDO_PRIVATE_KEY);
    if (!publicKey || !privateKey) {
      res.status(503).json({ error: 'Regiondo API keys not configured in environment variables.' });
      return;
    }

    const query = (req && req.query) || {};
    const subPath = String(query.path || '').replace(/^\/+|\/+$/g, '');
    if (!subPath) {
      res.status(400).json({ error: 'Missing Regiondo sub-path (query param "path")' });
      return;
    }

    const regiondoHost = normalizeHost(process.env.REGIONDO_API_HOST || process.env.VITE_REGIONDO_API_HOST);
    const rawSearch = new URL(req.url || '/', 'http://localhost').search;
    const rawQuery = rawSearch.startsWith('?') ? rawSearch.slice(1) : rawSearch;
    const queryString = sanitizeForwardQuery(rawQuery);
    const queryParams = new URLSearchParams(queryString);
    const targetPath = `/v1/${subPath}`;
    const target = queryString ? `${regiondoHost}${targetPath}?${queryString}` : `${regiondoHost}${targetPath}`;

    const { timestamp, hash } = sign(publicKey, privateKey, queryString);
    const headers = {
      'X-API-ID': publicKey,
      'X-API-TIME': timestamp,
      'X-API-HASH': hash,
      Accept: 'application/json',
      'Accept-Language': String(queryParams.get('store_locale') || 'de-AT'),
      'User-Agent': 'Mozarthaus-Regiondo-Proxy/1.0',
    };

    let body;
    if (!['GET', 'DELETE'].includes(method) && req.body != null && req.body !== '') {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      headers['Content-Type'] = (req.headers && req.headers['content-type']) || 'application/json';
    }

    let response = await fetch(target, { method, headers, body });
    let text = await response.text();

    // Some accounts do not expose /v1/products/{id}; fallback via list query.
    const productId = productIdFromSubPath(subPath);
    if (response.status === 404 && method === 'GET' && productId) {
      const listParams = new URLSearchParams(queryString);
      listParams.delete('currency');
      listParams.set('limit', '250');
      listParams.set('offset', '0');
      const listQuery = listParams.toString();
      const listTarget = `${regiondoHost}/v1/products${listQuery ? `?${listQuery}` : ''}`;
      const listSig = sign(publicKey, privateKey, listQuery);
      const listResponse = await fetch(listTarget, {
        method: 'GET',
        headers: {
          ...headers,
          'X-API-TIME': listSig.timestamp,
          'X-API-HASH': listSig.hash,
        },
      });
      const listText = await listResponse.text();
      if (listResponse.ok) {
        const parsed = parseJsonSafe(listText);
        const data = parsed && Array.isArray(parsed.data) ? parsed.data : [];
        const match = data.find((p) => String(p && p.product_id) === String(productId));
        if (match) {
          response = { status: 200, headers: new Headers({ 'content-type': 'application/json' }) };
          text = JSON.stringify({ data: match });
        }
      }
    }

    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.status(response.status).send(text);
  } catch (error) {
    res.status(500).json({
      error: 'Regiondo proxy handler crashed',
      detail: error && error.message ? error.message : String(error),
    });
  }
};
