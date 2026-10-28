import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { analytics } from '$lib/analytics'
import { listenForInstall } from '$lib/install.svelte'

listenForInstall()
analytics.start()

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
