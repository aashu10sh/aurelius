# Aurelius A*

A growth log for long-term goals. You set a few goals that matter, attach small repeatable tasks to each, and the app rewards you for showing up, on good days and tired ones.

Aurelius is inspired by Stoicism: it **measures what you control (effort)** and lets you judge what you don't (outcomes). It is built for a small circle of friends, runs on Cloudflare, and installs on your phone as a PWA (Capacitor builds come later).

---

## How it works

| Concept | Rule |
| --- | --- |
| **Goals** | Long-term aims like "Become a Senior Engineer" or "Get fit". Optional milestones (+50 XP each) or one measurable metric (e.g. 82 → 77 kg). |
| **Small tasks** | Repeatable actions under a goal, each with an **effort** (light / medium / heavy) and a **cadence** (daily, N× per week, N× per month). Tasks are interchangeable: any of them moves the goal. |
| **XP** | The headline number. Light 10, medium 20, heavy 30 per tick; milestone 50, completed goal 200, weekly reflection 20. Levels: level *L* at 50 × *L* × (*L* + 1) XP. |
| **Consistency** | XP earned on a goal over the last 28 days ÷ XP its cadences planned, capped at 100%. Being XP-based means extra walks can cover a missed gym session. |
| **Forgiving streaks** | "Never miss twice": one missed day is a grace day, two in a row end the streak. Planned rest days (max 1/week, set in advance) keep it alive. |
| **Days** | A day is the user's local calendar day and rolls over at 3am by default, so late-night work counts for the evening before. |
| **Reflection** | A weekly "did the work move you closer?" rating per goal plus three short questions, and an optional daily journal. |

XP is **derived** from stored facts (completions, ticked milestones, completed goals, reflections) rather than kept in a ledger, so totals can never drift.

## Screens

Welcome, sign in and sign up → onboarding (how it works, first goal, reminder) → four tabs: **Today**, **Goals** (list and detail), **Progress** (level, 26-week heatmap, XP per week), and **Journal** (weekly reflection, daily entries). **Settings** sits behind the avatar on Today.

The visual design is "Candlelight amber": warm near-black, amber accents, Geist with Geist Mono for numbers, and Newsreader italic for quotes. It was designed on a Claude Design canvas first.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Runtime | Cloudflare Workers |
| API | [Hono](https://hono.dev), Zod request validation |
| Database | Cloudflare D1 (SQLite) via [Drizzle ORM](https://orm.drizzle.team) 1.0 rc |
| Auth | [Better Auth](https://better-auth.com): email and password plus usernames, cookie sessions |
| Frontend | Svelte 5 + Vite, [sv-router](https://sv-router.dev) (file-based), TanStack Svelte Query |
| UI | Tailwind CSS v4, [shadcn-svelte](https://shadcn-svelte.com) (Bits UI), Lucide |
| PWA | vite-plugin-pwa (Workbox): installable, app shell works offline |
| Infra as code | [Alchemy](https://alchemy.run) v2 (beta) |
| Tooling | Bun workspaces, TypeScript, `bun test` |

## Repository layout

```
.
├── alchemy.run.ts          # Infrastructure: D1, migrations, both Workers, secrets, observability
├── package.json            # Workspace root: dev / deploy / destroy scripts
├── backend/                # Hono API (Cloudflare Worker), clean architecture
│   ├── src/
│   │   ├── domain/         # Models, rules (XP, consistency, streaks…), repository interfaces. No dependencies.
│   │   ├── application/    # Use cases (one class per file), services, ports (clock, ids, session)
│   │   ├── infrastructure/ # D1 repositories (Drizzle), Better Auth, schema, system clock
│   │   ├── presentation/   # HTTP: routes, Zod schemas, error mapping, the typed API contract
│   │   ├── container.ts    # Composition root: wires concrete implementations together
│   │   └── index.ts        # Worker entry
│   ├── migrations/         # Generated from the schema; applied to D1 on dev/deploy
│   └── test/               # Domain, use-case and HTTP tests with in-memory fakes
└── mobile/                 # Svelte PWA
    ├── src/
    │   ├── routes/         # File-based routes; _app/ = tabbed screens behind auth
    │   ├── lib/api/        # http → endpoints → queries (the only data API screens use)
    │   ├── lib/components/ # app/ (Aurelius components) and ui/ (shadcn-svelte)
    │   └── app.css         # Candlelight theme tokens
    ├── worker/index.ts     # Edge worker: forwards /api/* to the API (same origin)
    └── public/             # Icons, favicon
```

## Architecture

### Backend: clean architecture

Dependencies point inward. The domain knows nothing about Hono, Drizzle, D1 or Better Auth.

```
presentation (Hono routes, Zod)  →  application (use cases, services)  →  domain (models, rules, repository interfaces)
                                                                              ↑
                                     infrastructure (D1 repositories, Better Auth) implements the interfaces
```

- **Repositories and services are interfaces** (`IGoalRepository`, `IScoreService`, `IClock`, `ISessionService`…). Use cases receive them through their constructors and never see concrete types.
- **`container.ts` is the composition root**: the only file that knows which implementation backs which interface. Containers are built per request, because Worker bindings only exist per request.
- **Swappable layers:** replacing Hono, D1 or Better Auth only touches the outer layers.
- **Testability:** every layer is tested against in-memory fakes (`backend/test/fakes.ts`), with no database or network.

### One origin for the app and API

The browser only ever talks to the app's origin. The app's small edge worker (`mobile/worker/index.ts`) forwards `/api/*` to the API Worker over a service binding. That keeps auth cookies first-party in production, where the two Workers live on different `*.workers.dev` subdomains.

### Shared contract

`backend/src/presentation/http/contract.ts` exports the API's request and response types, exposed as `backend/contract`. The frontend imports them **type-only**, so client and server can't drift and no backend code ships to the browser.

---

## Getting started

### Prerequisites

- [Bun](https://bun.sh) 1.4+. Alchemy needs Bun or Node 24.11+.
- A Cloudflare account, only for deploying. Local dev runs entirely on your machine.

### Install and run

```sh
bun install
bun run dev
```

`bun run dev` (Alchemy) starts everything locally:

| Service | URL |
| --- | --- |
| App (PWA + `/api` proxy) | http://localhost:5173 |
| API Worker | http://localhost:1337 |

On the first run it generates migrations from the Drizzle schema, creates a local D1 database, applies the migrations, and generates the auth secret. Open http://localhost:5173 and sign up.

> The service worker is disabled in dev on purpose. To try installability or offline mode, run `bunx vite build && bunx vite preview` inside `mobile/`.

### Checks

```sh
cd backend && bun run test       # domain, use-case and HTTP tests
cd backend && bun run typecheck
cd mobile  && bun run check      # svelte-check + tsc
```

### Deploy

```sh
bunx alchemy profile edit --add Cloudflare   # once: OAuth or API token
bun run deploy
```

This deploys the D1 database (applying pending migrations), the API Worker and the app Worker with its static assets, then prints both URLs. `bun run destroy` tears the stack down.

Both Workers ship with Cloudflare **observability** enabled (persisted logs, invocation logs, traces and Workers Issues, 100% sampling). Find it under **Workers & Pages → Worker → Observability**.

> **State:** the stack uses `Alchemy.localState()`, which keeps deployment state in `.alchemy/` on this machine. Back it up, or switch to `Cloudflare.state()` in `alchemy.run.ts` before deploying from elsewhere.

---

## Working on the code

### Adding a backend feature

1. **Domain:** add or extend a model in `domain/models` and pure rules in `domain/rules`. If you need new data access, add methods to a repository interface in `domain/repositories`.
2. **Application:** write a use case in `application/usecases/<feature>/`, one class per file, with dependencies as interfaces in the constructor.
3. **Infrastructure:** implement the interface changes in `infrastructure/repositories` and update `infrastructure/db/schema.ts` if needed (migrations are generated on the next `bun run dev`).
4. **Presentation:** add a Zod schema in `schemas.ts`, a route in `routes/`, and any new types in `contract.ts`.
5. **Wire it up:** register the use case in `container.ts` and in `AppContainer` (`presentation/http/container.ts`), and mirror it in the fake container in `test/container.ts`.
6. **Test** the rule and the use case with the in-memory fakes.

### Frontend conventions

- Screens fetch and mutate only through `$lib/api/queries.ts`. Every write refreshes the cached reads, since one tick moves XP, consistency and the streak at once.
- Theme colors are CSS tokens in `mobile/src/app.css` (`bg-card`, `text-amber`, `bg-heat-3`…). Use them rather than raw hex values.
- Add shadcn-svelte components with `bunx shadcn-svelte@latest add <name>` (run in `mobile/`).
- Links use sv-router's typed `p('/goals/:id', { params })`, so a link to a route that doesn't exist fails the type-check.

### API overview

All routes live under `/api`. Everything except `/health` and `/auth/*` requires a session.

| Area | Endpoints |
| --- | --- |
| Auth | `/auth/*` (Better Auth) |
| Screens | `GET /today`, `GET /progress`, `GET /week`, `PUT /week/reflection` |
| Goals | `GET /goals?status=…`, `POST /goals`, `GET /goals/:id`, `PATCH /goals/:id`, `POST /goals/:id/status` |
| Tasks | `POST /goals/:id/tasks`, `PATCH /tasks/:id`, `POST /tasks/:id/completion`, `DELETE /tasks/:id/completion` |
| Milestones and metric | `POST /goals/:id/milestones`, `PATCH /milestones/:id`, `DELETE /milestones/:id`, `PUT /goals/:id/metric`, `POST /goals/:id/metric/logs` |
| Journal and rest | `GET /journal`, `PUT /journal`, `GET /rest-days`, `PUT /rest-days/:day`, `DELETE /rest-days/:day` |
| Me | `GET /me`, `PATCH /me/preferences` |

Errors share one shape, `{ "error": { "code", "message", "issues?" } }`: `400` malformed request, `401` signed out, `404` not found (including other users' data), `409` conflict (e.g. a task already ticked today), `422` a broken rule.

---

## Roadmap

- [ ] Reminder delivery: cron trigger → Queues → Web Push (the reminder time is already stored)
- [ ] Capacitor builds for iOS and Android (needs Better Auth's bearer-token plugin)
- [ ] Friends: shared heatmaps and weekly check-ins for goals marked "friends" (`visibility` already exists)
- [ ] Ad-hoc to-dos with deadlines
- [ ] Grow the quote set from 18 to ~100
- [ ] R2 for images, once needed (removed for now)
