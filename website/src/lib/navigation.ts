export const mainLinks = [
  { href: '/', label: 'עמוד הבית' },
  { href: '/about/', label: 'אודות' },
  { href: '/faq/', label: 'שאלות נפוצות' },
] as const;

export const serviceLinks = [
  { href: '/services/', label: 'השירותים שלנו', description: 'השירותים, התהליך וההתאמה לעסק', icon: 'list' },
  { href: '/services/whatsapp/', label: 'סוכן וואטסאפ', description: 'איסוף פרטים והכנת סיכום בשיחה', icon: 'chat' },
  { href: '/services/phone/', label: 'סוכן טלפוני', description: 'קבלת פניות גם בשיחה קולית', icon: 'phone' },
] as const;

export const utilityLinks = [
  { href: '/privacy/', label: 'מדיניות פרטיות' },
  { href: '/accessibility/', label: 'הצהרת נגישות' },
] as const;

export const sectionLinks = [
  { href: '/#channels', label: 'וואטסאפ וטלפון' },
  { href: '/#process', label: 'איך זה עובד' },
  { href: '/#trades', label: 'למי זה מתאים' },
  { href: '/#benefits', label: 'יתרונות' },
] as const;

export const contactLink = { href: '/contact/', label: 'יצירת קשר' } as const;

export const routes = [...mainLinks, ...serviceLinks, contactLink, ...utilityLinks];
