import { registerSW } from 'virtual:pwa-register'

// App updates, taken the way a native app takes them: a new version installs
// in the background and waits, and is applied while the app is out of sight,
// never mid-use. Waiting (instead of taking over at once) also keeps this
// version's lazily loaded screens available from the old service worker.
export const listenForUpdates = () => {
  let waiting = false
  let registration: ServiceWorkerRegistration | undefined
  const apply = registerSW({
    onNeedRefresh: () => (waiting = true),
    onRegisteredSW: (_url, r) => (registration = r),
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (waiting) void apply(true)
    } else {
      // Browsers look for a new service worker on page loads, which a long-lived
      // app rarely does, so look each time it comes back into view.
      void registration?.update().catch(() => {})
    }
  })

  // A screen's code is gone from the server (redeployed under a page no service
  // worker serves yet): reload into the new version, at most once a minute.
  window.addEventListener('vite:preloadError', (event) => {
    try {
      const last = Number(sessionStorage.getItem('aurelius:reloaded') ?? 0)
      if (Date.now() - last < 60_000) return
      sessionStorage.setItem('aurelius:reloaded', String(Date.now()))
    } catch {
      return
    }
    event.preventDefault()
    location.reload()
  })
}
