// Edge entry for the PWA. Only /api/* and /mp/* reach this worker
// (runWorkerFirst); everything else is static assets.
// - /api/* is forwarded untouched to the API worker, so the browser sees one origin.
// - /mp/* is a first-party proxy to Mixpanel's EU ingestion API, so ad
//   blockers don't drop analytics. The visitor's IP is passed on for
//   geolocation, as Mixpanel's proxy guide describes; cookies are not.

interface Fetcher {
  fetch(request: Request): Promise<Response>
}

interface Env {
  API: Fetcher
  ASSETS: Fetcher
}

const MIXPANEL = 'https://api-eu.mixpanel.com'

const toMixpanel = (request: Request, url: URL) => {
  const headers = new Headers(request.headers)
  headers.delete('cookie')
  const ip = request.headers.get('cf-connecting-ip')
  if (ip) headers.set('x-real-ip', ip)
  return fetch(`${MIXPANEL}${url.pathname.slice('/mp'.length)}${url.search}`, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
  })
}

export default {
  fetch(request: Request, env: Env) {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/')) return env.API.fetch(request)
    if (url.pathname.startsWith('/mp/')) return toMixpanel(request, url)
    return env.ASSETS.fetch(request)
  },
}
