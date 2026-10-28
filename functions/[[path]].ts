/**
 * Cloudflare Pages function. The storefront's files come from Pages; everything dynamic (the API,
 * uploaded images, sitemap.xml, robots.txt and each page's SEO tags) comes from the API on Cloud Run.
 * Both sit on one domain, so session cookies, the CSRF origin check and the Content-Security-Policy
 * work exactly as they do when one server serves everything.
 *
 * Pages → Settings → Variables and Secrets:
 *   API_ORIGIN    the Cloud Run address, e.g. https://gold-shop-api-abc123-el.a.run.app
 *   PROXY_SECRET  (secret) the same value as the API's PROXY_SECRET
 *
 * public/_routes.json keeps /assets/* and the icons from running this function at all.
 */

interface Env {
  ASSETS: { fetch(input: Request | URL | string): Promise<Response> };
  API_ORIGIN: string;
  PROXY_SECRET: string;
}

interface Context {
  request: Request;
  env: Env;
  waitUntil(promise: Promise<unknown>): void;
}

const API_PATHS = /^\/(api|uploads)\/|^\/(sitemap\.xml|robots\.txt)$/;

/** The API's security headers (Helmet), copied onto the pages served from here. */
const SECURITY_HEADERS = [
  'content-security-policy',
  'cross-origin-opener-policy',
  'cross-origin-resource-policy',
  'origin-agent-cluster',
  'referrer-policy',
  'strict-transport-security',
  'x-content-type-options',
  'x-dns-prefetch-control',
  'x-download-options',
  'x-frame-options',
  'x-permitted-cross-domain-policies',
  'x-xss-protection',
];

export async function onRequest({ request, env, waitUntil }: Context): Promise<Response> {
  const url = new URL(request.url);
  if (API_PATHS.test(url.pathname)) {
    if (url.pathname.startsWith('/uploads/') && request.method === 'GET') return upload(request, env, url, waitUntil);
    return toApi(request, env, url.pathname + url.search);
  }
  // Files (anything with an extension) and other methods: straight from Pages.
  const isPage = (request.method === 'GET' || request.method === 'HEAD') && !(url.pathname.split('/').pop() ?? '').includes('.');
  return isPage ? page(request, env, url) : env.ASSETS.fetch(request);
}

/** Headers that tell the API the request came through here, and from which visitor. */
function proxyHeaders(request: Request, env: Env, base: HeadersInit = {}): Headers {
  const headers = new Headers(base);
  headers.delete('host');
  headers.set('x-proxy-secret', env.PROXY_SECRET);
  const ip = request.headers.get('cf-connecting-ip');
  if (ip) headers.set('x-client-ip', ip);
  else headers.delete('x-client-ip');
  return headers;
}

function toApi(request: Request, env: Env, pathAndQuery: string): Promise<Response> {
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  return fetch(new URL(pathAndQuery, env.API_ORIGIN), {
    method: request.method,
    headers: proxyHeaders(request, env, request.headers),
    // streamed through untouched: the Razorpay webhook is verified against the raw bytes
    body: hasBody ? request.body : undefined,
    redirect: 'manual',
  });
}

/** Uploaded image files never change (random names), so keep them in Cloudflare's cache. */
async function upload(request: Request, env: Env, url: URL, waitUntil: Context['waitUntil']): Promise<Response> {
  const cache = (caches as unknown as { default: Cache }).default;
  const key = new Request(url.origin + url.pathname);
  const hit = await cache.match(key);
  if (hit) return hit;
  const res = await toApi(request, env, url.pathname);
  if (res.status === 200) waitUntil(cache.put(key, res.clone()));
  return res;
}

/** index.html from Pages, with the page's title, description, Open Graph tags and status from the API. */
async function page(request: Request, env: Env, url: URL): Promise<Response> {
  let html = await (await env.ASSETS.fetch(new URL('/', url))).text();
  let status = 200;
  const headers = new Headers({ 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' });
  try {
    const res = await fetch(new URL(`/api/seo/head?path=${encodeURIComponent(url.pathname)}`, env.API_ORIGIN), {
      headers: proxyHeaders(request, env, { accept: 'application/json' }),
    });
    if (res.ok) {
      const data = (await res.json()) as { head: string; status: number };
      // same substitution as renderPage() in server/src/services/seo.ts
      html = html.replace(/<title>[\s\S]*?<\/title>/, '').replace('<!--app-head-->', () => data.head);
      status = data.status;
      for (const name of SECURITY_HEADERS) {
        const value = res.headers.get(name);
        if (value) headers.set(name, value);
      }
    }
  } catch {
    // API unreachable: serve the plain page; the app sets its own title once it loads
  }
  return new Response(request.method === 'HEAD' ? null : html, { status, headers });
}
