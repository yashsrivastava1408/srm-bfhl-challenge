import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { processHierarchy } from './bfhl.js';

const envPath = resolve(process.cwd(), '.env');

if (existsSync(envPath)) {
  const envContents = await readFile(envPath, 'utf8');

  envContents
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .forEach((line) => {
      const [key, ...valueParts] = line.split('=');

      if (!process.env[key]) {
        process.env[key] = valueParts.join('=').trim();
      }
    });
}

const PORT = Number(process.env.PORT || 3001);
const clientDistPath = resolve(process.cwd(), 'client', 'dist');

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
}

async function readRequestBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
}

async function serveStaticFile(response, pathname) {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = join(clientDistPath, safePath);

  try {
    const fileContents = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': MIME_TYPES[extname(filePath)] || 'application/octet-stream',
    });
    response.end(fileContents);
    return true;
  } catch {
    if (pathname !== '/' && !pathname.includes('.')) {
      try {
        const html = await readFile(join(clientDistPath, 'index.html'));
        response.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
        });
        response.end(html);
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    response.end();
    return;
  }

  if (request.method === 'GET' && url.pathname === '/health') {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/bfhl') {
    try {
      const rawBody = await readRequestBody(request);
      const body = rawBody ? JSON.parse(rawBody) : {};
      const result = processHierarchy(body.data);
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 400, {
        error: 'Invalid JSON payload',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return;
  }

  if (existsSync(clientDistPath) && (request.method === 'GET' || request.method === 'HEAD')) {
    const served = await serveStaticFile(response, url.pathname);

    if (served) {
      return;
    }
  }

  sendJson(response, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`BFHL server running on http://localhost:${PORT}`);
});
