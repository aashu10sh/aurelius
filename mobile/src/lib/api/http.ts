import type { ApiError as ApiErrorBody } from 'backend/contract'

// Same origin: the app's worker forwards /api/* to the API.
const BASE = '/api'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly issues: { path: string; message: string }[] = [],
  ) {
    super(message)
  }
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 204) return undefined as T
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const error = (data as ApiErrorBody | null)?.error
    throw new ApiError(response.status, error?.code ?? 'unknown', error?.message ?? 'Something went wrong', error?.issues)
  }
  return data as T
}
