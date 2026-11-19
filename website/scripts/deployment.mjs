import business from '../src/data/business.json' with { type: 'json' };

export function isVercel(env = process.env) {
  return env.VERCEL === '1' || env.DEPLOY_TARGET === 'vercel';
}

export function siteOrigin(env = process.env) {
  return new URL(env.SITE_URL ?? business.origin).origin;
}

export function isLaunched(env = process.env) {
  return env.SITE_LAUNCHED === 'true'
    && (!isVercel(env) || env.VERCEL_ENV === 'production');
}

export function publicContact(env = process.env) {
  const phone = env.PUBLIC_PHONE ?? business.phone;
  const whatsapp = env.PUBLIC_WHATSAPP ?? business.whatsapp;
  return {
    name: business.name,
    legalName: env.PUBLIC_LEGAL_NAME ?? business.operator,
    email: env.PUBLIC_CONTACT_EMAIL ?? business.email,
    phone,
    phoneDisplay: env.PUBLIC_PHONE_DISPLAY ?? (phone === business.phone ? business.phoneDisplay : phone),
    phoneUrl: `tel:${phone}`,
    whatsapp,
    whatsappMessage: business.whatsappMessage,
    whatsappUrl: `https://wa.me/${whatsapp}?text=${encodeURIComponent(business.whatsappMessage)}`,
  };
}
