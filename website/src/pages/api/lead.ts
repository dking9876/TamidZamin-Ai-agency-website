import type { APIRoute } from 'astro';
import { handleLead } from '../../server/leads.js';

export const prerender = false;

export const ALL: APIRoute = (context) => handleLead(context.request, () => context.clientAddress);
