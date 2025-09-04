Short answer: **yes**—make “Add zod (or joi) validation” its own ticket with clear scope. Don’t bury it inside other stories or it’ll get skipped “for speed” and haunt you later.

Here’s a **Jira-style backlog for Week 1** you can paste in. I used `zod` as the default (clean DX, great TypeScript), but you can swap for `joi` with the same shapes.

---

# MyBidFit • Week 1 Backlog (MVP Core)

## Global

**Definition of Ready**

* User story written
* Acceptance criteria listed
* Designs (if any) linked
* Test approach noted
* Feature flag decision stated (Y/N)

**Definition of Done**

* ACs pass
* Unit + API tests added (≥80% for touched files)
* Playwright updated if flow changes
* Env vars documented
* CI job green
* Changelog entry + README updated

---

## MBF-101 — User Registration & Login

**Story:** As a new user, I can sign up and log in securely.
**Estimate:** 5 pts
**Dependencies:** None
**AC**

* Can sign up with email + password
* Login rejects bad creds; returns meaningful errors
* Session persists until logout
* Rate-limit auth endpoints (basic)
* Errors never leak stack traces in prod
  **Tasks**
* BE: Auth routes, hashed passwords, session/JWT
* FE: Forms + error states
* QA: API tests for happy/sad paths

---

## MBF-102 — Company Profile CRUD

**Story:** As a user, I can create/edit my company profile so matching works.
**Estimate:** 5 pts
**Dependencies:** MBF-101
**AC**

* Required fields: name, summary, NAICS (list), certifications (list)
* Optional: past performance entries (title, client, value, year, URL)
* Persisted and re-editable
* Empty states handled
  **Tasks**
* BE: Profile routes + DB model
* FE: Form with validation messages
* QA: API tests + FE component test

---

## MBF-103 — Opportunity List & Scoring (Sim Judges)

**Story:** As a user, I can see opportunities scored against my profile with judge breakdown.
**Estimate:** 8 pts
**Dependencies:** MBF-102
**AC**

* List view with score (0–100)
* Detail page shows per-judge scores, strengths, weaknesses
* Sorting by score works
* No external AI calls (deterministic)
  **Tasks**
* BE: Wire `opportunityScoring` service to route
* FE: List + detail pages
* QA: Unit tests for scoring edges

---

## MBF-104 — Seed Data Bootstrap

**Story:** As a new user, I immediately see 5–10 demo opportunities and 2 demo suppliers.
**Estimate:** 3 pts
**Dependencies:** MBF-103
**AC**

* `npm run seed` creates records idempotently
* New user can trigger scoring against seeds
  **Tasks**
* BE: Seeder script
* QA: Verify seeds in local & staging

---

## MBF-105 — **Add Schema Validation with Zod** ✅

**Story:** As the platform, I reject bad input up front to keep data clean.
**Estimate:** 5 pts
**Dependencies:** MBF-101/102 (parallel OK)
**AC**

* Zod schemas exist for: Auth, Profile, Opportunity
* All write endpoints validate request body/query/params
* 400 responses return machine-readable error objects
* Add `dotenv-safe` so required env vars are enforced
  **Tasks**
* BE: Install zod + zod-express middleware (or adapter)
* BE: Create `/schemas` with `auth.schema.ts`, `profile.schema.ts`, `opportunity.schema.ts`
* BE: Integrate schemas in routes
* Ops: Install `dotenv-safe`, add `.env.example`
* QA: API tests for invalid payloads

*Note:* If you prefer **joi**: swap schema files + middleware, AC unchanged.

---

## MBF-106 — API Integration Tests

**Story:** As QA, I can run one command to verify core APIs work.
**Estimate:** 3 pts
**Dependencies:** MBF-101..105
**AC**

* Tests cover: signup, login, create profile, fetch opportunities, fetch scoring detail
* Runs via `npm test` in CI
  **Tasks**
* BE: Node test runner + supertest
* CI: Add job to pipeline

---

## MBF-107 — Playwright E2E: Happy Path

**Story:** As QA, I can simulate the main user journey end-to-end.
**Estimate:** 5 pts
**Dependencies:** MBF-101..104
**AC**

* Script: register → login → create profile → view list → open detail → see judges
* Uses seed data
* Runs headless in CI
  **Tasks**
* FE/QA: Playwright setup & selectors
* CI: Cache browsers; record trace on failure

---

## MBF-108 — Error Handling & Observability

**Story:** As an operator, I can see clean errors and basic metrics.
**Estimate:** 3 pts
**Dependencies:** MBF-105
**AC**

* Central error middleware returns sanitized JSON
* Basic request logging (method, path, ms, status)
* Healthcheck endpoint `/healthz`
  **Tasks**
* BE: Error/health middleware
* Ops: Log format + sampling

---

## MBF-109 — Security & Rate Limits (Auth)

**Story:** As the platform, I reduce brute force risk on auth.
**Estimate:** 2 pts
**Dependencies:** MBF-101
**AC**

* Rate limiting on `/auth/*` (e.g., 5/min/IP with backoff)
* Lockout after N failed logins for T minutes
  **Tasks**
* BE: Add limiter middleware
* QA: Tests for throttle paths

---

## MBF-110 — CI Plumbing

**Story:** As a dev, I get fast feedback on every PR.
**Estimate:** 3 pts
**Dependencies:** MBF-106/107
**AC**

* Pipeline: lint → typecheck → unit/integration → Playwright E2E
* Artifacts: test reports + screenshots on fail
  **Tasks**
* DevOps: YAML workflow
* QA: Ensure tests tagged/split for speed

---

# Validation Schemas (quick sketch you can hand to agents)

```ts
// profile.schema.ts (zod)
import { z } from "zod";

export const PastPerf = z.object({
  title: z.string().min(3),
  client: z.string().min(2),
  value: z.number().nonnegative().optional(),
  year: z.number().int().min(1990).max(new Date().getFullYear()),
  url: z.string().url().optional(),
});

export const ProfileSchema = z.object({
  name: z.string().min(2),
  summary: z.string().min(20).max(600),
  naics: z.array(z.string().regex(/^\d{6}$/)).min(1),
  certifications: z.array(z.string()).default([]),
  pastPerformance: z.array(PastPerf).default([]),
});
```

```ts
// auth.schema.ts (zod)
export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10), // set your bar
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
```

---

# Suggested Sprint Order (with rough sequence)

1. MBF-105 (schemas) + MBF-101 (auth) in parallel
2. MBF-102 (profile)
3. MBF-103 (scoring) + MBF-104 (seeds)
4. MBF-106 (API tests)
5. MBF-107 (Playwright)
6. MBF-108/109 (err/limits)
7. MBF-110 (CI glue)


