import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pathToFileURL } from 'node:url';
import { createAccessGuard } from './auth/guard.js';

const files = {
  '/': 'index.html', '/index.html': 'index.html', '/style.css': 'style.css',
  '/app.js': 'app.js', '/data.js': 'data.js', '/format.js': 'format.js',
  '/icons.js': 'icons.js', '/comparison.js': 'comparison.js', '/login.js': 'login.js',
  '/hugol-source.js': 'hugol-source.js', '/hugol-model.js': 'hugol-model.js', '/hugol-ui.js': 'hugol-ui.js',
  '/hugo-source.js': 'hugo-source.js', '/hugo-model.js': 'hugo-model.js', '/increment-model.js': 'increment-model.js', '/comparison-model.js': 'comparison-model.js',
  '/assets/novo-hugo.webp': 'assets/novo-hugo.webp', '/assets/ses-goias.webp': 'assets/ses-goias.webp',
};

export function createAppServer({ password = process.env.DASHBOARD_PASSWORD } = {}) {
  const guard = createAccessGuard({ password });
  return http.createServer(async (incoming, outgoing) => {
    try {
      const requestUrl = new URL(incoming.url, `http://${incoming.headers.host || 'localhost'}`);
      const options = { method: incoming.method, headers: incoming.headers };
      if (!['GET', 'HEAD'].includes(incoming.method)) Object.assign(options, { body: incoming, duplex: 'half' });
      const request = new Request(requestUrl, options);
      const result = await guard(request, {
        ip: incoming.socket.remoteAddress,
        async next() {
          const file = files[requestUrl.pathname];
          if (!file) return new Response('Não encontrado', { status: 404 });
          const contentType = file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.webp') ? 'image/webp' : 'text/html; charset=utf-8';
          return new Response(incoming.method === 'HEAD' ? null : await readFile(new URL(file, import.meta.url)), { headers: { 'Content-Type': contentType } });
        },
      });
      outgoing.statusCode = result.status;
      result.headers.forEach((value, name) => outgoing.setHeader(name, value));
      if (incoming.method === 'HEAD' || !result.body) return outgoing.end();
      Readable.fromWeb(result.body).pipe(outgoing);
    } catch {
      outgoing.writeHead(500, { 'Cache-Control': 'no-store' });
      outgoing.end('Não foi possível concluir a solicitação.');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createAppServer().listen(process.env.PORT || 3000, '0.0.0.0', () => console.log('Servidor iniciado'));
}
