import { loginPage } from './login-page.js';

const encoder = new TextEncoder();
const COOKIE = 'hugo_session';
const SESSION_SECONDS = 8 * 60 * 60;
const publicAssets = new Set(['/assets/ses-goias.webp', '/assets/novo-hugo.webp', '/login.js']);
const baseHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Netlify-CDN-Cache-Control': 'no-store',
  'Vary': 'Cookie',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
};
const encode = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
function decode(text) {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) throw new Error('Invalid token');
  return Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - text.length % 4) % 4)), c => c.charCodeAt(0));
}
function response(body, status = 200, headers = {}) {
  return new Response(body, { status, headers: { ...baseHeaders, ...headers } });
}
const html = (message = '', status = 200, headers = {}, unavailable = false) => response(loginPage(message, unavailable), status, { 'Content-Type': 'text/html; charset=utf-8', ...headers });

export function createAccessGuard({ password, now = () => Date.now() }) {
  const attempts = new Map();
  const key = password ? crypto.subtle.importKey('raw', encoder.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']) : null;
  const digest = password ? crypto.subtle.digest('SHA-256', encoder.encode(password)) : null;
  const cookie = (request, token, maxAge) => `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;

  async function validSession(request) {
    try {
      const token = (request.headers.get('cookie') || '').split(';').map(part => part.trim()).find(part => part.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
      if (!token || token.length > 1024) return false;
      const parts = token.split('.');
      if (parts.length !== 2) return false;
      if (!await crypto.subtle.verify('HMAC', await key, decode(parts[1]), encoder.encode(parts[0]))) return false;
      const payload = JSON.parse(new TextDecoder().decode(decode(parts[0])));
      return Number.isFinite(payload.expires) && payload.expires > now() && payload.expires <= now() + SESSION_SECONDS * 1000;
    } catch { return false; }
  }

  return async function guard(request, context) {
    const url = new URL(request.url);
    if (publicAssets.has(url.pathname) && ['GET', 'HEAD'].includes(request.method)) return context.next();
    if (!password) return html('', 503, {}, true);

    if (url.pathname === '/auth/login' || url.pathname === '/auth/logout') {
      if (request.method === 'GET' && url.pathname === '/auth/login') {
        return await validSession(request) ? response(null, 303, { Location: '/' }) : html();
      }
      if (request.method !== 'POST') return response('Método não permitido', 405, { Allow: 'POST' });
      const origin = request.headers.get('origin');
      if (origin && origin !== url.origin) return response('Origem não permitida', 403);
      if (url.pathname === '/auth/logout') return response(null, 303, { Location: '/', 'Set-Cookie': cookie(request, '', 0) });

      const ip = context.ip || 'local';
      const currentTime = now();
      const record = attempts.get(ip);
      if (record && currentTime - record.start < 60000 && record.count >= 12) {
        return html('Muitas tentativas. Aguarde um minuto e tente novamente.', 429, { 'Retry-After': '60' });
      }
      // Reserve the attempt before awaiting body/crypto operations, including concurrent requests.
      if (attempts.size > 5000) attempts.delete(attempts.keys().next().value);
      attempts.set(ip, record && currentTime - record.start < 60000 ? { start: record.start, count: record.count + 1 } : { start: currentTime, count: 1 });
      if (Number(request.headers.get('content-length')) > 4096) return response('Requisição muito grande', 413);
      const body = await request.text();
      if (body.length > 4096) return response('Requisição muito grande', 413);
      const submitted = new URLSearchParams(body).get('password') || '';
      const candidate = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(submitted)));
      const expected = new Uint8Array(await digest);
      let mismatch = 0;
      for (let i = 0; i < expected.length; i++) mismatch |= expected[i] ^ candidate[i];
      if (mismatch) {
        return html('Senha incorreta. Tente novamente.', 401);
      }
      attempts.delete(ip);
      const payload = encode(encoder.encode(JSON.stringify({ expires: now() + SESSION_SECONDS * 1000, nonce: crypto.randomUUID() })));
      const signature = encode(await crypto.subtle.sign('HMAC', await key, encoder.encode(payload)));
      return response(null, 303, { Location: '/', 'Set-Cookie': cookie(request, payload + '.' + signature, SESSION_SECONDS) });
    }

    if (!await validSession(request)) {
      return url.pathname === '/' || url.pathname === '/index.html' ? html() : response('Autenticação necessária', 401, { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    if (!['GET', 'HEAD'].includes(request.method)) return response('Método não permitido', 405, { Allow: 'GET, HEAD' });
    const downstream = await context.next();
    const headers = new Headers(downstream.headers);
    for (const [name, value] of Object.entries(baseHeaders)) headers.set(name, value);
    return new Response(downstream.body, { status: downstream.status, statusText: downstream.statusText, headers });
  };
}
