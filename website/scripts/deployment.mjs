export function isVercel(env = process.env) {
  return env.VERCEL === '1' || env.DEPLOY_TARGET === 'vercel';
}

export function siteOrigin(env = process.env) {
  if (env.SITE_URL) return new URL(env.SITE_URL).origin;
  if (isVercel(env) && env.VERCEL_URL) return new URL(`https://${env.VERCEL_URL}`).origin;
  return 'http://localhost:4321';
}
