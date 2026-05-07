import { defineEventHandler, createError, readBody, setCookie } from 'h3'
import bcrypt from 'bcryptjs'
import { createSession, setSessionCookie, getUserByEmail } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const email = String(body?.email || '').trim().toLowerCase()
  const password = String(body?.password || '')

  const row = await getUserByEmail(email)
  if (!row) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const ok = await bcrypt.compare(password, row.password_hash)
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const session = await createSession(row.id)
  setSessionCookie(event, session.token, 30 * 24 * 60 * 60)

  return { ok: true, user: { id: row.id, email: row.email } }
})

