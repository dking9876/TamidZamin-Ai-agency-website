import type { APIRoute } from 'astro';

export const prerender = false;

export const ALL: APIRoute = () => Response.json({
  ok: false,
  message: 'טופס הפניות באתר הוסר. ליצירת קשר, עברו לוואטסאפ או התקשרו דרך עמוד יצירת הקשר.',
  contact: '/contact/',
}, {
  status: 410,
  headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
});
