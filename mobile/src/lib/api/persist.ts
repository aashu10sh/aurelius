import { dehydrate, hydrate, type QueryClient } from '@tanstack/svelte-query'

// The query cache, kept in localStorage so a launch paints the last known data
// at once and refreshes it in the background (restored data counts as stale).
// It's dropped when the app is rebuilt (response shapes may have changed) or a
// new day has started (yesterday's ticks would flash on Today).

const KEY = 'aurelius:queries'

type Saved = { build: string; date: string; state: ReturnType<typeof dehydrate> }

const today = () => new Date().toDateString()

export const restoreQueries = (client: QueryClient) => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Saved | null
    if (saved?.build === __BUILD_ID__ && saved.date === today()) hydrate(client, saved.state)
  } catch {
    // Unreadable or unavailable storage: start empty, as before.
  }
}

// Writes at most once a second while data keeps arriving.
export const persistQueries = (client: QueryClient) => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const save = () => {
    timer = undefined
    try {
      const saved: Saved = { build: __BUILD_ID__, date: today(), state: dehydrate(client) }
      localStorage.setItem(KEY, JSON.stringify(saved))
    } catch {
      // Full or blocked storage: the next launch just loads from the network.
    }
  }
  return client.getQueryCache().subscribe(() => {
    timer ??= setTimeout(save, 1000)
  })
}

export const forgetQueries = () => {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing stored.
  }
}
