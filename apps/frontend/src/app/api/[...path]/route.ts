import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Same-origin BFF proxy to the Nest API.
 *
 * Production frontend/API are on different `*.onrender.com` hosts (public
 * suffix → cross-site). Safari blocks those third-party auth cookies, so the
 * browser must talk only to the frontend origin; this route forwards to Nest
 * at request time using `API_URL`.
 */
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
]);

function backendBaseUrl(): string {
  return (
    process.env.API_URL ??
    process.env.BACKEND_URL ??
    'http://localhost:3001'
  ).replace(/\/$/, '');
}

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await context.params;
  const targetUrl = `${backendBaseUrl()}/${path.join('/')}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    // Required by undici when streaming a request body.
    ...(hasBody ? ({ duplex: 'half' } as RequestInit) : {}),
    redirect: 'manual',
    cache: 'no-store',
  });

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lower) || lower === 'set-cookie') {
      return;
    }
    responseHeaders.set(key, value);
  });

  // Preserve multiple Set-Cookie headers (auth + any others).
  const setCookies =
    typeof upstream.headers.getSetCookie === 'function'
      ? upstream.headers.getSetCookie()
      : [];

  if (setCookies.length > 0) {
    for (const cookie of setCookies) {
      responseHeaders.append('set-cookie', cookie);
    }
  } else {
    const single = upstream.headers.get('set-cookie');
    if (single) {
      responseHeaders.append('set-cookie', single);
    }
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
