import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1'

export type Db = DrizzleD1Database

export const createDb = (d1: D1Database): Db => drizzle(d1)
