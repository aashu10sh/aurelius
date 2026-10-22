import type { IClock } from '../application/ports/IClock'
import type { IIdGenerator } from '../application/ports/IIdGenerator'

export class SystemClock implements IClock {
  now(): Date {
    return new Date()
  }
}

export class UuidGenerator implements IIdGenerator {
  next(): string {
    return crypto.randomUUID()
  }
}
