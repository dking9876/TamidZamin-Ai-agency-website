import { defineMiddleware } from 'astro:middleware';
import { isLaunched } from '../scripts/deployment.mjs';
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'");
  if (!isLaunched() || context.url.hostname.endsWith('.vercel.app')
    || context.url.pathname.startsWith('/api/') || response.status >= 400) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
});
