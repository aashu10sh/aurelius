import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Drizzle from "alchemy/Drizzle";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

// Migrations are regenerated from the schema on every deploy/dev run and
// applied to D1. Generated files land in backend/migrations (commit them).
export const Schema = Drizzle.Schema("Schema", {
  schema: "./backend/src/infrastructure/db/schema.ts",
  out: "./backend/migrations",
  dialect: "sqlite",
});

export const Db = Cloudflare.D1.Database(
  "Db",
  Effect.gen(function* () {
    return { migrations: yield* Schema };
  }),
);

// Cloudflare Workers observability for both apps: persisted logs (incl. one
// invocation log per request), traces, and Workers Issues to group recurring
// errors. Sampling everything is fine at this scale; lower headSamplingRate
// if usage grows.
const observability = {
  enabled: true,
  headSamplingRate: 1,
  logs: { enabled: true, invocationLogs: true, headSamplingRate: 1, persist: true },
  traces: { enabled: true, headSamplingRate: 1, persist: true },
  issues: { enabled: true },
};

// Generated once and kept in state, so sessions survive redeploys.
export const AuthSecret = Alchemy.Random("AuthSecret");

// Daily reminders: the API's cron queues one job per due user, and the same
// Worker consumes them to compose and send each Web Push notification.
export const Reminders = Cloudflare.Queues.Queue("Reminders");

// Hono API plus the reminder cron and queue handlers, bundled by Alchemy.
export const Api = Cloudflare.Worker(
  "Api",
  Effect.gen(function* () {
    return {
      main: "./backend/src/index.ts",
      observability,
      // Every 5 minutes; must match REMINDER_WINDOW_MINUTES in domain/rules/reminder.ts.
      crons: ["*/5 * * * *"],
      env: {
        DB: yield* Db,
        REMINDERS: yield* Reminders,
        BETTER_AUTH_SECRET: (yield* AuthSecret).text,
        // Google OAuth client and VAPID key pair, from backend/.env (see the stack's `secrets`).
        GOOGLE_CLIENT_ID: yield* Config.NonEmptyString("GOOGLE_CLIENT_ID"),
        GOOGLE_CLIENT_SECRET: yield* Config.Redacted("GOOGLE_CLIENT_SECRET"),
        VAPID_PRIVATE_KEY: yield* Config.Redacted("VAPID_PRIVATE_KEY"),
        VAPID_SUBJECT: yield* Config.NonEmptyString("VAPID_SUBJECT"),
      },
    };
  }),
);

export default Alchemy.Stack(
  "aurelius",
  // Local file state in .alchemy/; switch to Cloudflare.state() to share deploys.
  {
    providers: Layer.mergeAll(Cloudflare.providers(), Drizzle.providers()),
    state: Alchemy.localState(),
    // Config values (the Google OAuth client) come from backend/.env, which
    // is gitignored; the shell environment still overrides it.
    secrets: Alchemy.Secrets.DotEnv({ path: "./backend/.env" }),
  },
  Effect.gen(function* () {
    const api = yield* Api;
    yield* Cloudflare.Queues.Consumer("RemindersConsumer", {
      queueId: (yield* Reminders).queueId,
      scriptName: api.workerName,
      settings: { batchSize: 25, maxRetries: 3, maxWaitTimeMs: 5000 },
    });

    // Svelte PWA (later wrapped with Capacitor). Its worker forwards /api/*
    // to the API over a service binding, so auth cookies stay first-party;
    // everything else is static assets with SPA fallback for the router.
    const app = yield* Cloudflare.Website.Vite("App", {
      rootDir: "./mobile",
      main: "./worker/index.ts",
      env: { API: api },
      assets: {
        notFoundHandling: "single-page-application",
        runWorkerFirst: ["/api/*"],
      },
      dev: { port: 5173 },
      observability,
    });

    return { api: api.url, app: app.url };
  }),
);
