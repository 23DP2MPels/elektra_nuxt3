import jwt from 'jsonwebtoken'
import { db } from './db'

const COOKIE_NAME = 'session'
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

export function setSessionCookie(event: any, token: string, maxAgeSeconds: number) {
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: maxAgeSeconds,
  })
}

export function clearSessionCookie(event: any) {
  deleteCookie(event, COOKIE_NAME, { path: '/' })
}

export function createSession(userId: string) {
  const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' })
  const now = Date.now()
  const expires = now + 30 * 24 * 60 * 60 * 1000
  db().prepare('INSERT INTO sessions(token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(token, userId, now, expires)
  return { token, expiresAt: expires }
}

export function getUserIdFromEvent(event: any) {
  const token = getCookie(event, COOKIE_NAME)
  if (!token) return null

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string }
    const row = db().prepare('SELECT user_id, expires_at FROM sessions WHERE token = ?').get(token) as { user_id: string; expires_at: number } | undefined
    if (!row) return null
    if (row.expires_at < Date.now()) return null
    if (!payload.sub) return null
    return row.user_id
  } catch {
    return null
  }
}

