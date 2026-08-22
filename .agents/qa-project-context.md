# LegitOrganic QA Project Context

## Product
- **Product:** LegitOrganic, a Ghana-focused ecommerce platform for produce, recipes, weekly delivery subscriptions, and B2B supply applications.
- **Type:** Ecommerce storefront and operational web application.
- **Critical journeys:** customer signup and email verification; customer login and token refresh; product search/browse and cart updates; one-time SeevCash checkout; payment failure and safe retry; signed webhook payment confirmation; weekly-delivery registration and explicit renewal checkout; subscription skip/pause/resume/cancel; B2B application submission and validation; customer order history and receipt access.

## Tech Stack
- **Frontend:** Next.js 16.3, React 19, TypeScript, Tailwind CSS 4 in `frontend/`.
- **Backend:** Django 5.2.17, Django REST Framework 3.16.1, SimpleJWT, PostgreSQL-compatible production database in `backend/`.
- **Integrations:** SeevCash checkout/webhooks, Resend email, Wigal SMS, Google OAuth/Maps, Cloudflare Turnstile, USDA nutrition API.
- **Production:** `https://legitorganic.com` and `https://api.legitorganic.com`.

## Test Stack
- **Backend:** Django `TestCase`/DRF `APITestCase` suites under each backend app.
- **Frontend:** ESLint, TypeScript through the Next.js production build. No committed browser E2E framework at the start of this QA pass; Playwright is the selected default for critical journeys.
- **API:** Django/DRF integration tests with third-party calls mocked; live production checks are read-only only.
- **Email:** Provider call assertions in backend tests. No local capture inbox is configured, so full inbox-delivery E2E remains a documented gap.

## CI/CD
- **Repository:** GitHub, production deploy script at `/var/www/legitorganic/deploy.sh`.
- **Current gate:** backend tests, frontend lint/build, dependency checks, and production smoke checks are run before deployment.
- **Artifacts:** local test output and failure traces; no dedicated Playwright report pipeline was present at the start of this pass.

## Environments
- **Local:** frontend `http://localhost:3000`; backend local Django service configured by `backend/.env`.
- **Production:** public storefront and API URLs above.
- **Payment rule:** automated tests must use SeevCash sandbox/mocks only. Production checks must never create orders, submit applications, or initiate payments.

## Quality Goals
- All critical backend suites pass with zero failures.
- Critical browser journeys complete without console errors or unhandled API failures.
- Zero live-payment or production-data mutation from automated QA.
- Critical regression suite target: under 15 minutes, below 2% flake rate, with failure screenshots/traces once Playwright is committed.

## Risk Areas
| Area | Risk | Impact | Likelihood | Score | Required coverage |
|---|---:|---:|---:|---:|---|
| SeevCash checkout, signed webhook, and idempotency | Critical | 5 | 4 | 20 | API integration, failure paths, duplicate delivery, UI retry |
| Authentication and email verification | Critical | 5 | 3 | 15 | API auth boundaries, signup/login UI, token refresh |
| Subscription renewal orders and lifecycle | Critical | 5 | 3 | 15 | state transitions, expiry, explicit checkout, authorization |
| Cart and order creation | High | 4 | 3 | 12 | totals, invalid products, guest/auth paths, UI persistence |
| B2B application and document handling | High | 4 | 3 | 12 | validation, bot protection, authorization, UI errors |
| Email/SMS notifications | High | 4 | 3 | 12 | correct trigger, retry behavior, provider failure persistence |
| Product browsing | Medium | 3 | 2 | 6 | search, sort, pagination/reveal, product detail links |

## Team
- No dedicated QA staffing information is recorded. Until updated, developers own automated regression coverage and release verification.

## Conventions
- Prefer semantic Playwright locators: `getByRole`, then `getByLabel`, then stable test IDs only where semantics are insufficient.
- Never use fixed sleeps, real payment credentials, or real customer data.
- Each test owns and cleans up its data; third-party providers are mocked except in explicitly approved sandbox tests.
- Fix only reproduced regressions and rerun the smallest affected suite before the full gate.

## Reassessment
- Re-score within 48 hours of a production incident, when a payment/auth provider changes, or quarterly at minimum.
