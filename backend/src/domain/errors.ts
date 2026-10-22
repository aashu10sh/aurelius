// Domain errors carry no transport details; the HTTP layer maps them to codes.
export abstract class DomainError extends Error {
  abstract readonly kind: 'not_found' | 'invalid' | 'conflict'
}

export class NotFoundError extends DomainError {
  readonly kind = 'not_found'
  constructor(entity: string) {
    super(`${entity} not found`)
  }
}

export class InvalidError extends DomainError {
  readonly kind = 'invalid'
}

export class ConflictError extends DomainError {
  readonly kind = 'conflict'
}
