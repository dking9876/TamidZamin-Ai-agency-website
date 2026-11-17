import type { APIRoute } from 'astro';
import { site } from '../lib/site';
export const prerender = true;
export const GET: APIRoute = () => new Response(
  site.launched
    ? `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${new URL('/sitemap.xml', site.origin).href}\n`
    : 'User-agent: *\nDisallow: /\n',
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
);
