# up-to-pilates-e2e

Playwright end-to-end test suite for [uptopilates.ro](https://uptopilates.ro/) - a
Reformer Pilates studio site (WordPress + the Amelia booking plugin + WooCommerce/Stripe
for payments). The suite runs against the **live production site** by default, so it
is deliberately conservative: it never completes a real payment, never lets a package
purchase reach checkout, and never sends a real contact-form submission unless you
explicitly opt in against a non-production environment.

## At a glance

**169 checks** guard the live site, from "does every page load" to "would ChatGPT be able to
read this page". A full run takes **about 6 minutes** on GitHub Actions and runs **every
morning**, so a problem introduced in WordPress (where no code review happens) is caught
the next day.

| Area           | What it protects                                                                                |  Checks | Runs on                                |
| -------------- | ----------------------------------------------------------------------------------------------- | ------: | -------------------------------------- |
| Smoke          | Every key page loads; the menu reaches every section; RO/EN switching                           |       8 | Chrome, Firefox, Safari                |
| Navigation     | The language switcher lands on the right translation for 7 page pairs; the header "Book" button |       8 | Chrome, Firefox, Safari                |
| Booking        | RO + EN visitors pick a service, date and time and reach the summary (stops before payment)     |       3 | Chrome, Firefox, Safari, iPhone, Pixel |
| Packages       | Packages and prices load; choosing one moves the flow forward (stops before checkout)           |       3 | Chrome, Firefox, Safari                |
| Contact        | The form, its required fields and its validation (nothing is sent)                              |       4 | Chrome, Firefox, Safari                |
| Journal        | Article cards per language, live links, brand punctuation, one title per article                |      18 | Chrome, Firefox, Safari                |
| FAQ            | All 20 questions per language, one FAQPage schema matching them, one icon per question          |       6 | Chrome, Firefox, Safari                |
| Campaigns      | Students Month: the header bar shows in October and disappears on 1 November                    |      10 | Chrome, Firefox, Safari                |
| Mobile         | No page scrolls sideways; menu, Book button and language switch; Journal cards and articles     |      31 | iPhone 14, Pixel 7                     |
| Accessibility  | No new WCAG 2.1 AA problems on 11 key pages (axe-core)                                          |      11 | Chrome                                 |
| SEO            | Titles, descriptions, canonicals, hreflang, structured data, sitemap, robots.txt                |      60 | HTTP only                              |
| AI visibility  | AI crawlers (ChatGPT, Claude, Perplexity, Bing) can read the site; `llms.txt` works             |       9 | HTTP only                              |
| External links | Links to Burn, Google Maps, gyms and running clubs still work                                   |       1 | HTTP only                              |
| Caching        | Booking pages are never cached; pages are served compressed                                     |       5 | HTTP only                              |
| Lighthouse     | Performance, accessibility, best-practice and SEO scores stay above set budgets                 | 6 pages | Chrome (mobile)                        |

### When it runs and how long it takes

| Trigger                           | What runs                                               | Time                         |
| --------------------------------- | ------------------------------------------------------- | ---------------------------- |
| Every pull request                | Full E2E suite + Lighthouse                             | ~6 min + ~4 min, in parallel |
| Every morning (05:00 / 05:30 UTC) | Full E2E suite, then Lighthouse                         | ~6 min, ~4 min               |
| On demand ("Run workflow")        | Either workflow                                         | same                         |
| Locally, Chromium + HTTP checks   | `npx playwright test --project=http --project=chromium` | under 1 min                  |

A failed scheduled run sends an email, and every run keeps an HTML report (with traces,
screenshots and videos for failures) as a downloadable artifact for 14 days.

### Built to be gentle with a live site

The suite tests production, a small studio's site on shared hosting, so it is designed to
check a lot while asking little of the server:

- **Checks that only read HTML run once, not once per browser.** SEO, AI visibility, links
  and caching use plain HTTP requests on a dedicated `http` project. This cut a full run from
  445 to 246 tests with the same coverage.
- **Browser-independent checks run on one browser.** Accessibility results don't depend on
  the engine, so they run on Chrome only.
- **The daily E2E run and Lighthouse are 30 minutes apart**, so they never load the host at
  the same time.
- **Nothing is ever bought, booked or sent.** See [Safety boundaries](#safety-boundaries-production-website).
- **Time-based behaviour is tested without waiting for the date.** Campaign tests set the
  browser clock, so "the banner disappears on 1 November" is checked today.
- **Flaky-by-nature sources are handled on purpose.** Hosts that can't be verified by a
  request (Instagram, Facebook, bot-protected sites) are skipped with a reason, and known
  site-wide accessibility issues are listed explicitly so only new ones fail the build.

## Prerequisites

- Node.js 20+ (LTS)
- npm

## Installation

```bash
npm install
npx playwright install --with-deps chromium firefox webkit
```

## Running locally

```bash
npm test                 # full suite, all desktop browsers + mobile
npm run test:headed      # same, with a visible browser window
npm run test:ui          # Playwright's interactive UI mode (best for local debugging)
```

### Running a specific suite or browser

```bash
npm run test:smoke        # tests/smoke only
npm run test:navigation   # tests/navigation only
npm run test:booking      # tests/booking only
npm run test:packages     # tests/packages only
npm run test:contact      # tests/contact only
npm run test:seo          # tests/seo only
npm run test:responsive   # tests/responsive only (mobile projects)
npm run test:journal      # tests/journal only
npm run test:faq          # tests/faq only
npm run test:campaigns    # tests/campaigns only (time-bound promotions)
npm run test:performance  # tests/performance only (page cache, compression)
npm run test:accessibility # tests/accessibility only (axe-core, WCAG 2.1 AA, Chromium)

npm run test:http         # SEO + performance HTTP checks (no browser)
npm run test:chromium     # browser tests, Chromium only
npm run test:firefox      # browser tests, Firefox only
npm run test:webkit       # browser tests, WebKit only
npm run test:mobile       # Mobile Chrome + Mobile Safari (responsive tests)
```

You can also use Playwright's own CLI filters directly, e.g.
`npx playwright test tests/booking --project=chromium -g "reach the booking summary"`.

### Viewing reports

```bash
npm run report   # opens the last local HTML report in a browser
```

An HTML report is always written to `playwright-report/`, and a JUnit XML report to
`test-results/junit.xml` (used by CI, but also produced locally).

### Code quality

```bash
npm run lint         # ESLint (includes eslint-plugin-playwright rules)
npm run lint:fix
npm run format        # Prettier --write
npm run format:check
npm run typecheck      # tsc --noEmit
```

## Environment variables

Copy `.env.example` to `.env` to override defaults, or export the variables directly.
The suite loads them via `utils/env.ts`; nothing is hardcoded and no secrets are
required to run it.

| Variable                    | Default                     | Purpose                                                             |
| --------------------------- | --------------------------- | ------------------------------------------------------------------- |
| `BASE_URL`                  | `https://uptopilates.ro/`   | Site under test. Point at a staging environment to run more freely. |
| `ENABLE_CONTACT_SUBMISSION` | `false`                     | Enables the one test that performs a real contact-form submission.  |
| `TEST_CONTACT_FIRST_NAME`   | `QA`                        | Used only when a real submission test is enabled.                   |
| `TEST_CONTACT_LAST_NAME`    | `Automation`                | Used only when a real submission test is enabled.                   |
| `TEST_CONTACT_EMAIL`        | `qa-automation@example.com` | Used only when a real submission test is enabled.                   |

Playwright itself also respects `CI=true`, which the workflow sets to enable retries,
a capped worker count, and `forbidOnly`.

## GitHub Actions

`.github/workflows/e2e.yml` runs on every pull request, on pushes to `main`, on demand
(Run workflow button), and every day at 05:00 UTC (07:00 in Cluj in winter). The daily run
catches regressions introduced on the WordPress side, where no pull request is involved;
GitHub emails the person who last changed the schedule when it fails. Scheduled runs are
paused automatically after 60 days without repository activity.

Each run:

1. Checks out the repo and sets up Node.js 22 with npm caching.
2. `npm ci`
3. `npm run lint` and `npm run typecheck`
4. Installs the three Playwright browsers.
5. `npm test` (base URL comes from the `BASE_URL` repository/environment variable,
   defaulting to production).
6. Always uploads the HTML report and JUnit XML as workflow artifacts.
7. On failure, also uploads `test-results/` (traces, screenshots, videos) so a failing
   run can be debugged without re-running it.

The job fails the workflow whenever any test fails - there is nothing that swallows a
non-zero exit code.

## Lighthouse (performance budgets)

`.github/workflows/lighthouse.yml` runs [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
on pull requests, on demand, and daily at 05:30 UTC (half an hour after the E2E run). It audits six key
pages on the default mobile profile, three runs each, and asserts on the median run
(`lighthouserc.json`):

| Check                    | Budget    | Level |
| ------------------------ | --------- | ----- |
| Performance score        | >= 60     | error |
| Accessibility score      | >= 90     | error |
| Best practices score     | >= 90     | error |
| SEO score                | >= 95     | error |
| Cumulative Layout Shift  | <= 0.1    | error |
| Total Blocking Time      | <= 600 ms | error |
| Largest Contentful Paint | <= 4 s    | warn  |

The performance floor is deliberately below today's scores (80-93) because lab scores vary by a
few points between runs; it catches real regressions (a heavy plugin, an unoptimised hero image),
not noise. The booking page is left out: the Amelia widget is rendered live on every request by
design. Run it locally with `npx @lhci/cli@0.15.1 autorun --config=lighthouserc.json`; the HTML
reports land in `lighthouse-report/` (also uploaded as a workflow artifact).

## Project structure

```
.github/workflows/e2e.yml   CI pipeline
playwright.config.ts        Base URL, projects, reporters, timeouts. SEO and performance
                            specs only make HTTP requests, so they run once on the "http"
                            project instead of once per browser
fixtures/                   Playwright test extended with page-object fixtures
pages/                      Page Object Model (one class per page/component)
test-data/                  Routes and fixed test data, separate from test logic
utils/                      env.ts (config) and seo.ts (HTML/head parsing helpers)
tests/
  smoke/                    Every key page loads
  navigation/               Internal links, redirects, RO/EN language switcher
  booking/                  Critical booking journey (stops before payment)
  packages/                 Package listing + selection flow (stops before checkout)
  contact/                  Contact form visibility, validation, safe submission
  seo/                      Canonical/hreflang/robots/JSON-LD/sitemap regressions, per-page
                            on-page basics, and AI visibility (crawler access, llms.txt)
  journal/                  Journal front page loop, article template and brand punctuation
  faq/                      FAQ accordion: question count, one FAQPage schema in step with the
                            visible questions, a single open/closed icon per question
  campaigns/                Time-bound promotions (Students Month); browser clock is pinned
                            so date-based behaviour is tested deterministically
  performance/              Page cache never applied to booking pages; gzip compression
  accessibility/            axe-core WCAG 2.1 AA scan of key pages; known site-wide issues
                            are listed in the spec and excluded, anything new fails
  responsive/               Mobile Chrome/Safari: nav + booking smoke, no sideways scroll on
                            any key page, header controls, Journal layout on a phone
```

### Why this structure

- **Page objects** (`pages/`) hide selectors and multi-step interactions (e.g. driving
  the Amelia booking widget) behind readable methods like
  `bookingPage.completeUpToBookingSummary()`. Tests read as business behaviour, not
  DOM plumbing.
- **Fixtures** (`fixtures/pages.fixture.ts`) wire page objects into Playwright's `test`,
  so every spec just destructures `{ bookingPage }` etc. instead of `new BookingPage(page)`
  everywhere.
- **Test data** (`test-data/`) is the single source of truth for routes (RO and EN) and
  form payloads, so a URL change is a one-line edit.
- Selectors favour accessible roles, `aria-label`s, and the site's own stable
  `data-page`/`data-date` attributes over generated CSS classes, per the site's actual
  markup (confirmed by inspecting the live DOM, not guessed).

## How to add a new test

1. Pick the right folder under `tests/` (or create a new one if it's a genuinely new
   category).
2. Import `{ test, expect }` from `../../fixtures/pages.fixture` (not
   `@playwright/test`) so you get the page-object fixtures.
3. Prefer an existing page object's methods; add a method to it if the interaction is
   reusable, rather than inlining selectors in the spec.
4. Use web-first assertions (`await expect(locator).toBeVisible()`, `toHaveText()`,
   etc.) instead of manual waits or reading text with `.allInnerTexts()` and asserting
   afterwards.
5. Keep the test independent - it must pass in isolation and in any order (no shared
   state between tests).

## How to add a new Page Object

1. Create `pages/YourPage.ts`, extending `BasePage` if it represents a full page
   (you get `.goto()` and cookie-banner handling for free).
2. Expose locators as getters and multi-step actions as `async` methods - keep raw
   selectors out of test files entirely.
3. Export it from `pages/index.ts`.
4. Add a fixture entry in `fixtures/pages.fixture.ts` so tests can consume it via
   destructuring.

Don't create a page object for a single static page with nothing to interact with -
a direct `page.goto()` + heading assertion in the spec is enough (see the smoke tests
for `preturi`/`intrebari-frecvente`).

## How to debug a failed test

- `npm run test:ui` - the most productive option locally: step through actions, inspect
  the DOM snapshot at each step, and re-run a single test.
- `npm run test:debug` - opens the Playwright Inspector paused at the first action.
- After any run, `npm run report` shows the HTML report, including a trace viewer link
  for any test that retried, plus screenshots/videos for failures
  (`screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`, `trace: 'on-first-retry'`
  in `playwright.config.ts`).
- In CI, download the `playwright-html-report` or `playwright-test-results` artifact
  from the failed workflow run and open `playwright-report/index.html` locally, or
  `npx playwright show-trace <trace.zip>` for a specific trace.

## Safety boundaries (production website)

This suite runs against a real business's production site, so several tests are
deliberately scoped to stop short of anything destructive:

- **Booking flow** (`tests/booking/booking-flow.spec.ts`): drives the Amelia widget
  through service → date → time selection, on both /rezervare/ and /en/book/, and stops
  as soon as the "Datele dumneavoastră" / "Your Information" (your details) step and the
  "Plată" / "Payments" step are visible in the stepper. It never fills in personal details or proceeds into payment, so no real
  appointment or Stripe charge is ever created.
- **Packages flow** (`tests/packages/packages.spec.ts`): selects a package and confirms
  the flow advances past the selection screen, then stops - it never reaches checkout,
  so no real package purchase happens.
- **Contact form** (`tests/contact/contact-form.spec.ts`): fully tests client-side
  validation (empty form, missing consent) without ever sending a request. The one test
  that performs a real submission is **skipped by default** and only runs when
  `ENABLE_CONTACT_SUBMISSION=true` is set - point `BASE_URL` at a staging site before
  enabling it, since a real run against production emails the business.

## What the suite has caught so far

Real issues on the live site, found by these tests rather than by visitors:

- **Missing sitemap.** `robots.txt` pointed to a sitemap that returned `404`. Fixed on the site.
- **Journal articles falling back to the theme template.** An update from the classic
  WordPress editor brought back a second page title and an extra author/date bar on all four
  articles. Fixed, and now guarded by `tests/journal`.
- **An insecure outbound link.** The Running Clubs article linked to `http://` instead of
  `https://`. Fixed.
- **Accessibility.** Brand orange and teal text sits below the WCAG contrast ratio, and some
  links have hidden labels that don't match their visible text. Tracked as known issues in
  `tests/accessibility` until the design is updated.
