import { test as base } from '@playwright/test';
import { HomePage, Navigation, LanguageSwitcher, BookingPage, PackagesPage, ContactPage, ReformerPage } from '../pages';

type PageFixtures = {
  homePage: HomePage;
  navigation: Navigation;
  languageSwitcher: LanguageSwitcher;
  bookingPage: BookingPage;
  packagesPage: PackagesPage;
  contactPage: ContactPage;
  reformerPage: ReformerPage;
};

/**
 * Extends the base Playwright test with ready-to-use page objects, so spec
 * files only ever deal with business-level actions instead of constructing
 * page objects by hand in every test.
 */
export const test = base.extend<PageFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  navigation: async ({ page }, use) => {
    await use(new Navigation(page));
  },
  languageSwitcher: async ({ page }, use) => {
    await use(new LanguageSwitcher(page));
  },
  bookingPage: async ({ page }, use) => {
    await use(new BookingPage(page));
  },
  packagesPage: async ({ page }, use) => {
    await use(new PackagesPage(page));
  },
  contactPage: async ({ page }, use) => {
    await use(new ContactPage(page));
  },
  reformerPage: async ({ page }, use) => {
    await use(new ReformerPage(page));
  },
});

export { expect } from '@playwright/test';
