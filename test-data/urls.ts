/**
 * Known site routes, kept separate from test logic.
 * Paths are relative to `baseURL` (see playwright.config.ts / utils/env.ts).
 */

export const routes = {
  ro: {
    home: '/',
    reformer: '/reformer-pilates-cluj/',
    pricing: '/preturi/',
    faq: '/intrebari-frecvente/',
    contact: '/contact-cluj/',
    booking: '/rezervare/',
    packagesBooking: '/rezervari-pachete/',
  },
  en: {
    home: '/en/',
    reformer: '/en/reformer/',
    packages: '/en/packages/',
    faq: '/en/faq/',
    contact: '/en/contact/',
    booking: '/en/book/',
  },
} as const;

/** Pages that should always resolve with a real 200 and are safe to crawl in bulk. */
export const criticalPages: { name: string; path: string }[] = [
  { name: 'Home (RO)', path: routes.ro.home },
  { name: 'Reformer (RO)', path: routes.ro.reformer },
  { name: 'Pricing (RO)', path: routes.ro.pricing },
  { name: 'FAQ (RO)', path: routes.ro.faq },
  { name: 'Contact (RO)', path: routes.ro.contact },
  { name: 'Booking (RO)', path: routes.ro.booking },
  { name: 'Packages booking (RO)', path: routes.ro.packagesBooking },
  { name: 'Home (EN)', path: routes.en.home },
  { name: 'Reformer (EN)', path: routes.en.reformer },
  { name: 'Packages (EN)', path: routes.en.packages },
  { name: 'FAQ (EN)', path: routes.en.faq },
  { name: 'Contact (EN)', path: routes.en.contact },
  { name: 'Booking (EN)', path: routes.en.booking },
];

/** RO <-> EN pairs used to verify the language switcher lands on the translated equivalent. */
export const translatedPagePairs: { name: string; ro: string; en: string }[] = [
  { name: 'Home', ro: routes.ro.home, en: routes.en.home },
  { name: 'Reformer', ro: routes.ro.reformer, en: routes.en.reformer },
  { name: 'FAQ', ro: routes.ro.faq, en: routes.en.faq },
  { name: 'Contact', ro: routes.ro.contact, en: routes.en.contact },
];
