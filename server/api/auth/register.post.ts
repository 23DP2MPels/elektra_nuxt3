import bcrypt from 'bcryptjs'
import { db } from '../../utils/db'
import { id } from '../../utils/ids'
import { createSession, setSessionCookie } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const email = String(body?.email || '').trim().toLowerCase()
  const password = String(body?.password || '')

  if (!email || !email.includes('@')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid email' })
  }
  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 6 chars' })
  }

  const existing = db().prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Email already registered' })
  }

  const userId = id('usr')
  const passwordHash = await bcrypt.hash(password, 10)
  const now = Date.now()

  db().prepare('INSERT INTO users(id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(userId, email, passwordHash, now)

  const session = createSession(userId)
  setSessionCookie(event, session.token, 30 * 24 * 60 * 60)

  return { ok: true, user: { id: userId, email } }
})

