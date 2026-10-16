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
    journal: '/jurnal/',
    studentsMonth: '/pilates-pentru-studenti-cluj/',
    articleExamSeason: '/journal/sesiunea-cluj-studenti/',
  },
  en: {
    home: '/en/',
    reformer: '/en/reformer/',
    packages: '/en/packages/',
    faq: '/en/faq/',
    contact: '/en/contact/',
    booking: '/en/book/',
    packagesBooking: '/en/packages-booking/',
    journal: '/en/journal/',
    studentsMonth: '/en/pilates-for-students-cluj/',
    articleExamSeason: '/en/journal/exam-season-cluj/',
    articleRunningClubs: '/en/journal/running-clubs-cluj/',
    articleFitnessExpats: '/en/journal/fitness-in-cluj-for-expats-erasmus-students/',
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
  { name: 'Journal (RO)', path: routes.ro.journal },
  { name: 'Students Month (RO)', path: routes.ro.studentsMonth },
  { name: 'Article: exam season (RO)', path: routes.ro.articleExamSeason },
  { name: 'Home (EN)', path: routes.en.home },
  { name: 'Reformer (EN)', path: routes.en.reformer },
  { name: 'Packages (EN)', path: routes.en.packages },
  { name: 'FAQ (EN)', path: routes.en.faq },
  { name: 'Contact (EN)', path: routes.en.contact },
  { name: 'Booking (EN)', path: routes.en.booking },
  { name: 'Journal (EN)', path: routes.en.journal },
  { name: 'Students Month (EN)', path: routes.en.studentsMonth },
  { name: 'Article: exam season (EN)', path: routes.en.articleExamSeason },
  { name: 'Article: running clubs (EN)', path: routes.en.articleRunningClubs },
  { name: 'Article: fitness for expats (EN)', path: routes.en.articleFitnessExpats },
];

/** Amelia booking flows - must never be served from the page cache. */
export const bookingPages: { name: string; path: string }[] = [
  { name: 'Booking (RO)', path: routes.ro.booking },
  { name: 'Booking (EN)', path: routes.en.booking },
];

/**
 * Pages that exist but are deliberately kept out of search results
 * (package booking helpers and the author archive behind the "By Danny K." byline).
 */
export const noindexPages: { name: string; path: string }[] = [
  { name: 'Packages booking (RO)', path: routes.ro.packagesBooking },
  { name: 'Packages booking (EN)', path: routes.en.packagesBooking },
  { name: 'Author archive (RO)', path: '/author/dannyk/' },
  { name: 'Author archive (EN)', path: '/en/author/dannyk/' },
];

/** Every page that should be indexable: critical pages minus booking flows and noindex helpers. */
export const indexablePages = criticalPages.filter(
  ({ path }) => !bookingPages.some((p) => p.path === path) && !noindexPages.some((p) => p.path === path),
);

/** RO <-> EN pairs used to verify the language switcher lands on the translated equivalent. */
export const translatedPagePairs: { name: string; ro: string; en: string }[] = [
  { name: 'Home', ro: routes.ro.home, en: routes.en.home },
  { name: 'Reformer', ro: routes.ro.reformer, en: routes.en.reformer },
  { name: 'FAQ', ro: routes.ro.faq, en: routes.en.faq },
  { name: 'Contact', ro: routes.ro.contact, en: routes.en.contact },
  { name: 'Journal', ro: routes.ro.journal, en: routes.en.journal },
  { name: 'Students Month', ro: routes.ro.studentsMonth, en: routes.en.studentsMonth },
  { name: 'Article: exam season', ro: routes.ro.articleExamSeason, en: routes.en.articleExamSeason },
];

/** Journal articles. The EN-only guides have no RO translation, so they carry no hreflang. */
export const journalArticles: { name: string; path: string }[] = [
  { name: 'Exam season (RO)', path: routes.ro.articleExamSeason },
  { name: 'Exam season (EN)', path: routes.en.articleExamSeason },
  { name: 'Running clubs (EN)', path: routes.en.articleRunningClubs },
  { name: 'Fitness for expats (EN)', path: routes.en.articleFitnessExpats },
];
