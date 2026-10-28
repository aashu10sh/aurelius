import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { analytics } from '$lib/analytics'
import { persistQueries, restoreQueries } from '$lib/api/persist'
import { queryClient } from '$lib/api/queries'
import { listenForInstall } from '$lib/install.svelte'
import { seemsSignedIn } from '$lib/session'
import { listenForUpdates } from '$lib/updates'

listenForInstall()
listenForUpdates()
analytics.start()

// Last session's data, so the first screen paints filled while it refreshes.
if (seemsSignedIn()) restoreQueries(queryClient)
persistQueries(queryClient)

// Arrivals marked with ?via=… (Google sign-in, a tapped notification):
// track them once, then clean the URL.
const params = new URLSearchParams(location.search)
const via = params.get('via')
if (via === 'google') analytics.track('Signed In', { method: 'google' })
if (via === 'notification') analytics.track('Notification Opened', { kind: params.get('kind') })
if (via) {
  params.delete('via')
  params.delete('kind')
  const query = params.toString()
  history.replaceState(history.state, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`)
}

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
