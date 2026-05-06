import Database from 'better-sqlite3'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'

let _db: Database.Database | null = null

function getDbPath() {
  // Keep DB inside project (works in dev); adjust later for production.
  const dir = join(process.cwd(), '.data')
  mkdirSync(dir, { recursive: true })
  return join(dir, 'app.sqlite')
}

export function db() {
  if (_db) return _db
  _db = new Database(getDbPath())
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  return _db
}

