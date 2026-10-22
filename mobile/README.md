# Aurelius · mobile

The Aurelius app: a Svelte 5 PWA in the "Candlelight amber" design, to be wrapped with Capacitor for iOS and Android later. See the [root README](../README.md) for the product, setup and deployment.

```sh
bun run check     # svelte-check + tsc
bun run build     # production build (with service worker)
bun run preview   # serve the build, e.g. to test install / offline
```

For day-to-day work, run `bun run dev` at the repo root. It starts this app at http://localhost:5173 with the API proxied at `/api`.

## Stack

| | |
| --- | --- |
| Framework | Svelte 5 (runes) + Vite 8 |
| Routing | [sv-router](https://sv-router.dev), file-based, typed links |
| Data | TanStack Svelte Query over a small typed fetch client |
| UI | Tailwind CSS v4, [shadcn-svelte](https://shadcn-svelte.com) (Bits UI, vaul drawer, sonner toasts) |
| Auth | `better-auth/svelte` client |
| PWA | vite-plugin-pwa (Workbox) |
| Fonts | Geist, Geist Mono and Newsreader, bundled via Fontsource so they work offline |

## Layout

```
src/
├── routes/                  File-based routes (sv-router)
│   ├── hooks.ts             "/" → /today when signed in, else /welcome
│   ├── welcome · sign-in · sign-up
│   ├── onboarding/          How it works → first goal → reminder
│   └── _app/                Tabbed screens (the "_" folder is a group: no URL segment)
│       ├── hooks.ts         Auth guard
│       ├── layout.svelte    Scroll area + tab bar
│       ├── today · progress · journal · settings
│       └── goals/           index · new · [id]
├── lib/
│   ├── api/
│   │   ├── http.ts          fetch wrapper → ApiError
│   │   ├── endpoints.ts     one typed function per API endpoint
│   │   └── queries.ts       queries, mutations, cache invalidation: what screens use
│   ├── components/
│   │   ├── app/             Aurelius components (TaskRow, Heatmap, GoalForm, …)
│   │   └── ui/              shadcn-svelte components (generated, then themed)
│   ├── auth.ts · session.ts Better Auth client, cached session for route guards
│   ├── format.ts            Day labels, cadence text, percentages
│   └── quotes.ts            Stoic quotes, one per day
├── app.css                  Theme tokens (Candlelight) and base styles
└── App.svelte               Query client, router, toaster
worker/index.ts              Edge worker: forwards /api/* to the API Worker
public/                      Favicon and PWA icons
```

## Data

Screens read and write only through `$lib/api/queries.ts`:

```svelte
<script lang="ts">
  import { todayQuery, useToggleTask } from '$lib/api/queries';
  const today = todayQuery();
  const toggle = useToggleTask();
</script>
```

- **Typed against the backend:** request and response types come from `backend/contract` as type-only imports, so a breaking API change is a type error here.
- **Writes refresh everything:** `useAction` refreshes all queries after any write, because one tick moves XP, consistency, the streak and the heatmap at once.
- **Ticking is instant:** `useToggleTask` updates Today immediately and rolls back if the server refuses.
- **Same-origin API:** requests go to relative `/api/...` paths, so auth cookies stay first-party. In production, `worker/index.ts` (`runWorkerFirst: ["/api/*"]`) forwards them to the API over a service binding.

## Design system

The tokens live in `src/app.css`. shadcn's names (`--primary`, `--card`, `--muted-foreground`…) carry the Candlelight colors, so stock components come out amber. Aurelius-specific tokens are available as Tailwind classes:

| Token | Use |
| --- | --- |
| `bg-background` `#110E0B` / `bg-card` `#1C1814` | Page / borderless cards |
| `bg-primary` `#E3A04F` + `text-primary-foreground` | Amber buttons with dark text |
| `text-amber` / `text-amber-bright` | Accent text / highlighted numbers |
| `text-soft` / `text-muted-foreground` | Secondary / tertiary text |
| `bg-heat-0` … `bg-heat-4` | Heatmap scale |
| `bg-track`, `bg-chip`, `border-faint` | Progress tracks, effort chips, empty checkboxes |

Helpers: `.eyebrow` (small mono uppercase label) and `.card-list` (hairlines between rows). Use `font-mono` for every number, and `font-serif italic` only for quotes.

Add shadcn-svelte components with:

```sh
bunx shadcn-svelte@latest add <component>
```

`components.json` was written by hand, because the CLI's `init` needs an encoded design preset. `add` works normally.

## Routing

- **Typed links:** use sv-router's `p('/goals/:id', { params: { id } })` and `navigate(...)`. A link to a route that doesn't exist fails `bun run check`.
- **Generated routes:** the route table is generated into `.router/` from `src/routes` on dev and build.
- **Guards:** route hooks (`hooks.ts`) run `beforeLoad` and redirect with `throw navigate('/welcome')`.

## PWA

`vite.config.ts` configures the manifest and a Workbox service worker:

- **Precache:** the app shell is precached, and in-app links fall back to `index.html` offline.
- **No API caching:** `/api/*` always goes to the network.
- **Updates:** `registerType: 'autoUpdate'`, so an installed app picks up new deploys on its own.
- **Dev mode:** the service worker is off in dev; use `bun run build && bun run preview` to test it.

The icons in `public/` are rendered from `public/icon.svg`. The logo is drawn as paths, so it doesn't depend on fonts. To regenerate them with ImageMagick:

```sh
magick -background none -density 384 public/icon.svg -resize 512x512 public/pwa-512x512.png
```

The maskable icon is the same artwork scaled into the 80% safe zone on a full-bleed background.

## Capacitor (later)

The native shell won't share the web origin, so it needs Better Auth's bearer-token plugin (instead of cookies) and an absolute API URL in `src/lib/api/http.ts` and `src/lib/auth.ts`.
