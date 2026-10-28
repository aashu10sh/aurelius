// Installing Aurelius as a PWA. Chromium browsers fire `beforeinstallprompt`,
// which we hold on to so a button can show the native dialog later. iOS has
// no prompt, so there we can only explain Share → Add to Home Screen.

import { analytics } from './analytics'

type InstallPromptEvent = Event & {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const standalone = () =>
  matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

const ios = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  // iPadOS reports itself as a Mac.
  (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)

let deferred = $state<InstallPromptEvent | null>(null)
let installed = $state(standalone())

// Called once from main.ts: the event can fire before any screen mounts.
export const listenForInstall = () => {
  addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferred = event as InstallPromptEvent
  })
  addEventListener('appinstalled', () => {
    analytics.track('App Installed')
    installed = true
    deferred = null
  })
}

export const install = {
  // Already running as the installed app.
  get installed() {
    return installed
  },
  // 'prompt': native dialog available · 'ios': manual steps · 'manual': browser menu
  get method(): 'prompt' | 'ios' | 'manual' {
    return deferred ? 'prompt' : ios() ? 'ios' : 'manual'
  },
  async prompt() {
    if (!deferred) return false
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    deferred = null
    return outcome === 'accepted'
  },
}
