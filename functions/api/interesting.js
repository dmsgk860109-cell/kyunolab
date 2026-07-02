export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const slug = cleanSlug(url.searchParams.get('slug'));
    if (!slug) return json({ ok: false, count: null }, 400);
    const count = await readCount(env, slug);
    return json({ ok: true, count });
  }

  if (request.method === 'POST') {
    let payload = {};
    try {
      payload = await request.json();
    } catch (_) {}

    const slug = cleanSlug(payload.slug);
    if (!slug) return json({ ok: false, count: null }, 400);

    const count = await incrementCount(env, slug);
    return json({ ok: true, count });
  }

  return json({ ok: false, count: null }, 405);
}

function cleanSlug(value) {
  if (typeof value !== 'string') return '';
  const slug = value.trim().toLowerCase();
  return /^[a-z0-9-]{2,120}$/.test(slug) ? slug : '';
}

async function readCount(env, slug) {
  if (!env.INTERESTING_KV) return null;
  const value = await env.INTERESTING_KV.get(`interesting:${slug}`);
  const count = Number.parseInt(value || '0', 10);
  return Number.isFinite(count) && count > 0 ? count : null;
}

async function incrementCount(env, slug) {
  if (!env.INTERESTING_KV) return null;
  const current = (await readCount(env, slug)) || 0;
  const next = current + 1;
  await env.INTERESTING_KV.put(`interesting:${slug}`, String(next));
  return next;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}
