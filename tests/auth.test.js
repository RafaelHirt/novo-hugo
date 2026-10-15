import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createAccessGuard } from '../auth/guard.js';

const request = (path = '/', options = {}) => new Request('https://dashboard.example' + path, options);
const context = { ip: '192.0.2.1', next: async () => new Response('protected-data', { headers: { 'Cache-Control': 'public, max-age=86400' } }) };
const login = (guard, password) => guard(request('/auth/login', { method: 'POST', body: new URLSearchParams({ password }) }), context);

test('Página e dados exigem login; somente imagens institucionais e script do login são públicos', async () => {
  const guard = createAccessGuard({ password: randomUUID() });
  const page = await guard(request(), context);
  assert.match(await page.text(), /Senha de acesso/);
  for (const path of ['/data.js', '/app.js', '/comparison.js', '/hugol-source.js', '/hugol-model.js', '/hugol-ui.js', '/hugo-source.js', '/hugo-model.js', '/increment-model.js', '/comparison-model.js', '/index.html?download=1']) {
    const result = await guard(request(path), context);
    assert.equal((await result.text()).includes('protected-data'), false);
    if (path.endsWith('.js')) assert.equal(result.status, 401);
  }
  assert.equal(await (await guard(request('/assets/ses-goias.webp'), context)).text(), 'protected-data');
  assert.equal(await (await guard(request('/login.js'), context)).text(), 'protected-data');
});

test('Login correto gera cookie assinado HttpOnly e Secure; os dados privados não podem ser armazenados em cache', async () => {
  const password = randomUUID();
  const guard = createAccessGuard({ password });
  const wrong = await login(guard, randomUUID());
  assert.equal(wrong.status, 401);
  assert.equal(wrong.headers.has('set-cookie'), false);
  const success = await login(guard, password);
  assert.equal(success.status, 303);
  const cookie = success.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Secure/);
  assert.equal(cookie.includes(password), false);
  const result = await guard(request('/data.js', { headers: { Cookie: cookie.split(';')[0] } }), context);
  assert.equal(await result.text(), 'protected-data');
  assert.match(result.headers.get('cache-control'), /no-store/);
  assert.equal(result.headers.get('netlify-cdn-cache-control'), 'no-store');
});

test('Sessões adulteradas, vencidas ou assinadas com uma senha anterior não liberam dados', async () => {
  let time = Date.now();
  const password = randomUUID();
  const guard = createAccessGuard({ password, now: () => time });
  const cookie = (await login(guard, password)).headers.get('set-cookie').split(';')[0];
  const tampered = await guard(request('/data.js', { headers: { Cookie: cookie + 'tampered' } }), context);
  assert.equal(tampered.status, 401);
  const rotated = createAccessGuard({ password: randomUUID(), now: () => time });
  assert.equal((await rotated(request('/data.js', { headers: { Cookie: cookie } }), context)).status, 401);
  time += 8 * 60 * 60 * 1000 + 1;
  assert.equal((await guard(request('/data.js', { headers: { Cookie: cookie } }), context)).status, 401);
});

test('Senha ausente mantém a aplicação fechada e tentativas de login têm limitação', async () => {
  const missing = createAccessGuard({});
  const unavailable = await missing(request('/data.js'), context);
  assert.equal(unavailable.status, 503);
  assert.equal((await unavailable.text()).includes('protected-data'), false);
  let time = Date.now();
  const password = randomUUID();
  const guard = createAccessGuard({ password, now: () => time });
  for (let i = 0; i < 12; i++) assert.equal((await login(guard, 'incorrect')).status, 401);
  const blocked = await login(guard, password);
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get('retry-after'), '60');
  time += 60001;
  assert.equal((await login(guard, password)).status, 303);
});

test('Saída remove o cookie e formulários de outra origem são recusados', async () => {
  const guard = createAccessGuard({ password: randomUUID() });
  const logout = await guard(request('/auth/logout', { method: 'POST' }), context);
  assert.equal(logout.status, 303);
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
  const external = await guard(request('/auth/login', { method: 'POST', headers: { Origin: 'https://other.example' }, body: 'password=anything' }), context);
  assert.equal(external.status, 403);
});

test('Tentativas simultâneas também entram no limite por IP', async () => {
  const password = randomUUID();
  const guard = createAccessGuard({ password });
  const attempts = await Promise.all(Array.from({ length: 12 }, () => login(guard, 'incorrect')));
  assert.ok(attempts.every(result => result.status === 401));
  assert.equal((await login(guard, password)).status, 429);
});

test('Adaptador do Netlify usa a mesma validação e bloqueia quando a variável não existe', async () => {
  const { default: access } = await import('../netlify/edge-functions/access.js');
  const previous = globalThis.Netlify;
  const password = randomUUID();
  try {
    globalThis.Netlify = { env: { get: () => undefined } };
    assert.equal((await access(request('/data.js'), context)).status, 503);
    globalThis.Netlify = { env: { get: () => password } };
    assert.equal((await access(request('/data.js'), context)).status, 401);
    const success = await access(request('/auth/login', { method: 'POST', body: new URLSearchParams({ password }) }), context);
    const cookie = success.headers.get('set-cookie').split(';')[0];
    assert.equal(await (await access(request('/data.js', { headers: { Cookie: cookie } }), context)).text(), 'protected-data');
  } finally { globalThis.Netlify = previous; }
});
