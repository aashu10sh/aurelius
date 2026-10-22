import type { ErrorHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { DomainError } from '../../domain/errors'

const STATUS: Record<DomainError['kind'], ContentfulStatusCode> = {
  not_found: 404,
  invalid: 422,
  conflict: 409,
}

// Body shape for every error: { error: { code, message, issues? } }.
export const onError: ErrorHandler = (err, c) => {
  if (err instanceof DomainError) {
    return c.json({ error: { code: err.kind, message: err.message } }, STATUS[err.kind])
  }
  console.error(err)
  return c.json({ error: { code: 'internal', message: 'Something went wrong' } }, 500)
}
