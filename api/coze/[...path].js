export default async function handler(req, res) {
  const pat = process.env.COZE_PAT;
  if (!pat) {
    res.status(500).json({ error: 'Missing COZE_PAT in environment variables.' });
    return;
  }

  const upstreamBase = 'https://api.coze.cn';
  const rawPath = Array.isArray(req.query?.path) ? req.query.path.join('/') : String(req.query?.path ?? '');
  const search = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const url = `${upstreamBase}/${rawPath}${search}`;

  const headers = {};
  headers.Authorization = `Bearer ${pat}`;
  headers['Content-Type'] = 'application/json';

  // Forward only what we need; avoid leaking host-specific headers
  const upstreamRes = await fetch(url, {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(req.body ?? {}),
  });

  const contentType = upstreamRes.headers.get('content-type') || '';
  res.status(upstreamRes.status);
  res.setHeader('Content-Type', contentType.includes('application/json') ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8');

  const text = await upstreamRes.text();
  res.send(text);
}

