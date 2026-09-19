# up-to-pilates-e2e

Playwright end-to-end test suite for [uptopilates.ro](https://uptopilates.ro/) - a
Reformer Pilates studio site (WordPress + the Amelia booking plugin + WooCommerce/Stripe
for payments). The suite runs against the **live production site** by default, so it
is deliberately conservative: it never completes a real payment, never lets a package
purchase reach checkout, and never sends a real contact-form submission unless you
explicitly opt in against a non-production environment.

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

npm run test:chromium     # everything, Chromium only
npm run test:firefox      # everything, Firefox only
npm run test:webkit       # everything, WebKit only
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

`.github/workflows/e2e.yml` runs on every pull request and on pushes to `main`:

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

## Project structure

```
.github/workflows/e2e.yml   CI pipeline
playwright.config.ts        Base URL, projects, reporters, timeouts
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
  seo/                      Canonical/hreflang/robots/JSON-LD/sitemap regressions
  responsive/               Mobile-viewport smoke (nav + booking), Mobile Chrome/Safari
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
  through service → date → time selection and stops as soon as the "Datele
  dumneavoastră" (your details) step and the "Plată" (payment) step are visible in the
  stepper. It never fills in personal details or proceeds into payment, so no real
  appointment or Stripe charge is ever created.
- **Packages flow** (`tests/packages/packages.spec.ts`): selects a package and confirms
  the flow advances past the selection screen, then stops - it never reaches checkout,
  so no real package purchase happens.
- **Contact form** (`tests/contact/contact-form.spec.ts`): fully tests client-side
  validation (empty form, missing consent) without ever sending a request. The one test
  that performs a real submission is **skipped by default** and only runs when
  `ENABLE_CONTACT_SUBMISSION=true` is set - point `BASE_URL` at a staging site before
  enabling it, since a real run against production emails the business.

## A known finding from building this suite

While building the SEO checks, `tests/seo/seo-technical.spec.ts` surfaced a real
production issue: `robots.txt` declares
`Sitemap: https://uptopilates.ro/sitemap_index.xml`, but that URL currently returns
`404`. The test correctly fails until that's fixed on the site - this is intentional,
not a bug in the framework.
