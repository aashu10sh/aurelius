# Aurelius · backend

The Aurelius API: a [Hono](https://hono.dev) app running as a Cloudflare Worker, with D1 (via Drizzle) for storage and [Better Auth](https://better-auth.com) for accounts. It is mounted at `/api` and reached through the app's origin. See the [root README](../README.md) for the product, setup and deployment.

```sh
bun run test        # domain, use-case and HTTP tests (bun test)
bun run typecheck   # tsc --noEmit
```

The API doesn't run on its own: `bun run dev` at the repo root starts it (with D1 and migrations) through Alchemy.

## Layers

The code follows clean architecture: **dependencies point inward**, and the domain knows nothing about Hono, Drizzle, D1 or Better Auth.

```
src/
├── domain/            Pure TypeScript. Depends on nothing.
│   ├── models/        Goal, Task, Completion, Milestone, Metric, Journal, User, Day
│   ├── rules/         xp · consistency · streak · cadence · restDay · invariants
│   ├── repositories/  IGoalRepository, ITaskRepository, … (interfaces only)
│   └── errors.ts      NotFoundError · InvalidError · ConflictError
├── application/       Orchestrates the domain. Depends on domain only.
│   ├── ports/         IClock · IIdGenerator · ISessionService
│   ├── services/      ICalendarService · IScoreService (interface + implementation)
│   └── usecases/      One class per file, grouped by feature
├── infrastructure/    Implements the interfaces.
│   ├── db/            Drizzle schema (source of truth for migrations), D1 client
│   ├── repositories/  D1GoalRepository, … (rows ↔ domain models)
│   ├── auth/          Better Auth setup, BetterAuthSessionService
│   └── system.ts      SystemClock, UuidGenerator
├── presentation/http/ Hono app, routes, Zod request schemas, error mapping, API contract
├── container.ts       Composition root: the only place concrete classes are wired up
└── index.ts           Worker entry: createApp(makeContainer)
```

### How a request flows

1. `presentation/http/app.ts` builds a container for the request (`withContainer`) and resolves the user (`requireSession` → `ISessionService`).
2. A route validates input with a Zod schema (`schemas.ts`), then calls **one use case**.
3. The use case loads data through **repository interfaces**, applies **domain rules**, and returns a plain read model (`usecases/views.ts`, `TodayView`, `ProgressView`…).
4. Domain errors map to HTTP in `errors.ts`: `not_found` → 404, `invalid` → 422, `conflict` → 409. Malformed requests are rejected earlier with 400.

### Dependency injection

Use cases take interfaces in their constructors and never touch concrete types:

```ts
export class CompleteTaskUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly goals: IGoalRepository,
    private readonly tasks: ITaskRepository,
    private readonly completions: ICompletionRepository,
    private readonly calendar: ICalendarService,
    private readonly ids: IIdGenerator,
    private readonly clock: IClock,
  ) {}

  async execute(userId: string, taskId: string): Promise<Completion> { … }
}
```

`container.ts` builds the real graph (D1 repositories, the system clock, Better Auth). `test/container.ts` builds the same graph from in-memory fakes. Because ids and time come from `IIdGenerator` and `IClock`, tests are fully deterministic.

## Scoring rules

All scoring lives in `domain/rules` as pure functions:

| File | What it decides |
| --- | --- |
| `xp.ts` | XP by effort (10 / 20 / 30), milestone 50, goal 200, reflection 20; level curve 50 × L × (L + 1) |
| `consistency.ts` | Earned ÷ planned XP over a 28-day window (shorter for new goals), capped at 1 |
| `cadence.ts` | Cadence periods (day / ISO week / month) and planned counts |
| `streak.ts` | "Never miss twice": active, rest, grace, missed and pending days |
| `restDay.ts` | Rest days are planned in advance, max 1 per week |
| `invariants.ts` | Titles, cadence limits, goal status transitions, metric checks |

**XP is derived, not stored.** Total XP = completion XP + 50 × milestones done + 200 × goals completed + 20 × reflections. D1 has no multi-statement transactions, so a separate ledger could drift; derived totals can't. Each completion stores the XP it earned, so changing a task's effort never rewrites history.

**Days** are `'YYYY-MM-DD'` strings in the user's time zone, shifted by `dayStartHour` (default 3) so that 1:30am counts for the day before (`domain/models/day.ts`).

## Database

- **Schema:** `src/infrastructure/db/schema.ts`. It holds Better Auth's tables (`user`, `session`, `account`, `verification`) and the Aurelius tables.
- **Migrations** are generated into `migrations/` by Alchemy's `Drizzle.Schema` whenever the schema changes, then applied to D1 on `bun run dev` and `bun run deploy`. Commit the generated folders, and don't edit them by hand.
- **Mapping:** repositories convert rows to domain models, so the domain never sees Drizzle types.

## Auth

Better Auth is mounted at `/api/auth/*` as-is: email and password sign-up, the `username` plugin for username sign-in, and Google.

- **One user, several sign-in methods.** A user can have a password, Google, or both, and sign in with either.
- **No automatic linking.** Sign-up emails aren't verified, so Google sign-in never attaches itself to an existing password account with the same email. Someone could have registered that address first. Better Auth refuses (`?error=account_not_linked`), and the app tells the user to sign in with their password and connect Google in Settings.
- **Explicit linking** from Settings (`linkSocial`) is allowed with a different Google email, since the user proves both. Google can be disconnected only while a password exists.
- **Hosts:** the base URL is taken from the request but limited to `allowedHosts` (`localhost:*`, `aurelius-app-*.workers.dev`). Add a custom domain there and in the Google console.
 Users also carry Aurelius preferences (`timezone`, `reminderTime`, `dayStartHour`) as additional fields. The rest of the app only sees `ISessionService.currentUserId(headers)`. The auth secret is generated by Alchemy and kept in its state.

## Bindings

`src/env.ts` types the Worker bindings by hand, and must match the `Api` worker's `env` in `../alchemy.run.ts`:

| Binding | Type |
| --- | --- |
| `DB` | `D1Database` |
| `BETTER_AUTH_SECRET` | `string` (generated by Alchemy) |
| `GOOGLE_CLIENT_ID` | `string` (from `backend/.env`) |
| `GOOGLE_CLIENT_SECRET` | `string` (secret, from `backend/.env`) |

`alchemy.run.ts` reads `backend/.env` through `Alchemy.Secrets.DotEnv`. Shell variables of the same name override it.

## API contract

`src/presentation/http/contract.ts` is exported as `backend/contract`. It holds the JSON shapes of every response (`Json<T>` turns `Date` into `string`) and the request types inferred from the Zod schemas. The frontend imports it **type-only**.

## Adding a feature

1. **Domain:** model or rule in `domain/`, plus repository interface methods if needed.
2. **Use case:** `application/usecases/<feature>/DoThingUseCase.ts`, with dependencies as interfaces.
3. **Infrastructure:** implement the new repository methods; update the schema if needed.
4. **HTTP:** a Zod schema, a route, and contract types.
5. **Wiring:** add it to `container.ts`, `AppContainer` (`presentation/http/container.ts`) and `test/container.ts`.
6. **Tests:** cover the rule (`test/domain`), the use case with fakes (`test/application`) and, where useful, the route (`test/presentation`).
