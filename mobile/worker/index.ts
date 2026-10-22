// Edge entry for the PWA. Only /api/* reaches this worker (runWorkerFirst);
// it is forwarded untouched to the API worker so the browser sees one origin.

interface Fetcher {
  fetch(request: Request): Promise<Response>
}

interface Env {
  API: Fetcher
  ASSETS: Fetcher
}

export default {
  fetch(request: Request, env: Env) {
    const { pathname } = new URL(request.url)
    return pathname.startsWith('/api/') ? env.API.fetch(request) : env.ASSETS.fetch(request)
  },
}
