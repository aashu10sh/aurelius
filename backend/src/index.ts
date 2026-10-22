import { makeContainer } from './container'
import type { Env } from './env'
import { createApp } from './presentation/http/app'

export default createApp<Env>(makeContainer)
