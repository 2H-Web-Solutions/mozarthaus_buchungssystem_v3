/**
 * POST /api/webhook-regiondo
 * Logs payload to Vercel Function logs.
 */
function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed', allow: ['POST'] });
    return;
  }

  const line = {
    at: new Date().toISOString(),
    query: req.query || {},
    contentType: req.headers['content-type'],
    body: req.body,
  };

  console.log('[webhook-regiondo]', JSON.stringify(line, null, 2));

  res.status(200).json({ ok: true, receivedAt: line.at });
}

module.exports = handler;
module.exports.default = handler;
