# LocalSearch Playwright Quick Start

A small Playwright starter repo for LocalSearch staff who need to add reliable browser tests without rebuilding the test harness from scratch.

This repo is based on the two Playwright patterns already proven in the HB Plastics workers codebase:

1. **Hermetic browser tests** for client-side behaviour: render/serve a local page, intercept network calls, and prove what the browser actually does without touching production data.
2. **Live-origin smoke tests** for deployed journeys: hit a real deployed site, keep the journey non-destructive, run serially, and retain traces/screenshots/video when something fails.

The starter defaults to the second pattern because it is the easiest way for staff to begin testing an existing LocalSearch site.

## 1. Install

```bash
git clone https://github.com/dhargraves1987-sys/Playwright-Quick-Start.git
cd Playwright-Quick-Start
npm install
npx playwright install chromium
```

The first `npm install` creates `package-lock.json`. Commit that lockfile once the starter is adopted by a real project, then change CI from `npm install` to `npm ci`.

## 2. Point it at a site

Set `BASE_URL` when running the tests:

```bash
BASE_URL=https://www.example.com npm run test:smoke
```

Or set a GitHub Actions repository variable named:

```text
PLAYWRIGHT_BASE_URL
```

A manual GitHub Actions run can also override the URL.

## 3. Run tests

```bash
npm test
npm run test:smoke
npm run test:headed
npm run test:ui
npm run test:debug
npm run report
```

### Which command should I use?

- `npm run test:smoke` — normal automated check.
- `npm run test:headed` — watch Chromium perform the test.
- `npm run test:ui` — Playwright's interactive test runner; best when writing tests.
- `npm run test:debug` — pauses execution so you can inspect locators and page state.

## 4. Starter test

`tests/smoke/site.smoke.spec.ts` intentionally does only safe checks:

- homepage returns a healthy HTTP response;
- body renders instead of a generic application/build failure;
- primary navigation exists and contains links.

Replace these with the critical customer journey for the site you are testing.

## Recommended LocalSearch test structure

Start with a few high-value journeys, not hundreds of brittle tests.

```text
tests/
  smoke/
    homepage.smoke.spec.ts
    lead-form.smoke.spec.ts
    navigation.smoke.spec.ts
  e2e/
    customer-enquiry.spec.ts
    login.spec.ts
```

Good first candidates are:

- homepage loads;
- primary navigation works;
- key service/location page loads;
- phone/CTA links are present;
- lead form can be completed up to the safe boundary;
- logged-in app opens the expected landing page;
- critical search/filter journey works.

## Rules for reliable tests

### Prefer user-facing locators

Good:

```ts
page.getByRole('button', { name: 'Get a quote' })
page.getByLabel('Email')
page.getByText('Thank you')
```

Use `data-testid` when the UI has no stable semantic locator.

Avoid long CSS/XPath selectors tied to layout.

### Let Playwright wait

Playwright assertions auto-wait:

```ts
await expect(page.getByRole('heading', { name: 'Contact us' })).toBeVisible();
```

Do not add arbitrary sleeps such as `waitForTimeout(5000)` unless timing itself is what you are testing.

### Keep production smoke tests non-destructive

A live smoke test should normally stop before actions such as:

- charging a card;
- submitting a real customer lead;
- deleting data;
- publishing content;
- sending messages/emails;
- changing production records.

If a journey must mutate state, use an isolated test account/environment and explicitly clean it up.

### Control state instead of clicking through irrelevant setup

Seed known state using APIs, cookies, storage, fixtures, or network interception when that makes the test deterministic.

The HB Plastics storefront tests use deterministic cart state rather than relying on a fragile sequence of product UI clicks. The product-master browser tests intercept POSTs so browser behaviour can be proven without modifying a real purchase order.

### Test browser behaviour with Playwright; test strings with unit tests

Use Playwright when the question is:

- did JavaScript actually execute?;
- did this button become enabled?;
- did storage persist across a reload?;
- did the request contain the right payload?;
- did the page navigate correctly?;
- is something really hidden from browser scope?

Do not use Playwright merely to assert that a server-rendered HTML string contains a word when a fast unit test can do that.

## CI behaviour

`.github/workflows/playwright.yml` runs on:

- pull requests;
- pushes to `main`;
- manual dispatch.

The workflow:

1. installs Node dependencies;
2. installs Chromium and Linux browser dependencies;
3. runs the smoke suite;
4. uploads Playwright reports/test artifacts only when the run fails.

The config uses:

- Chromium/Desktop Chrome only to keep the starter fast;
- one worker for live-site safety and readable output;
- CI retries for transient live-origin failures;
- `forbidOnly` so a committed `test.only()` cannot silently reduce CI coverage;
- screenshots, video and traces retained on failure.

## Environment-specific Chromium

Normally Playwright manages Chromium itself.

If an agent/build environment already provides a Chromium binary, set:

```bash
PW_CHROMIUM_PATH=/path/to/chromium npm test
```

This mirrors the HB Plastics setup, where some agent environments have a pre-installed browser whose revision does not match Playwright's managed download.

## Turning this into a project-specific suite

For a new LocalSearch project:

1. set the project's `PLAYWRIGHT_BASE_URL` GitHub Actions variable;
2. rename `site.smoke.spec.ts` after the journey being tested;
3. add 3-5 critical non-destructive journeys;
4. generate and commit `package-lock.json`;
5. change the workflow install command to `npm ci`;
6. add stable test IDs only where semantic locators are not sufficient;
7. make the Playwright job a required PR check once the suite is trustworthy.

Do not make an unstable test required. Fix the source of flakiness first.

## When to use a local/hermetic server instead

If you need to prove client-side behaviour without depending on a deployed environment, add a separate config/suite using Playwright's `webServer` option.

That is the pattern used by HB Plastics for its PO scan page: a tiny local HTTP server serves deterministic generated pages, requests are intercepted, retries are disabled, and the test can safely run as a PR blocker because it cannot touch D1, external services, or production records.

Use the local pattern for UI logic. Use the live-origin pattern for deployment health. Keeping those two questions separate makes failures much easier to understand.
