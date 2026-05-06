import bcrypt from 'bcryptjs'
import { db } from '../../utils/db'
import { createSession, setSessionCookie } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const email = String(body?.email || '').trim().toLowerCase()
  const password = String(body?.password || '')

  const row = db().prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(email) as { id: string; email: string; password_hash: string } | undefined
  if (!row) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const ok = await bcrypt.compare(password, row.password_hash)
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const session = createSession(row.id)
  setSessionCookie(event, session.token, 30 * 24 * 60 * 60)

  return { ok: true, user: { id: row.id, email: row.email } }
})

