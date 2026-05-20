import { defineEventHandler, createError, readBody, setCookie } from 'h3'
import bcrypt from 'bcryptjs'
import { createSession, setSessionCookie, getUserByEmail } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const email = String(body?.email || '').trim().toLowerCase()
  const password = String(body?.password || '')

  console.log('[LOGIN] Attempt for email:', email)

  const row = await getUserByEmail(email)
  if (!row) {
    console.log('[LOGIN] User not found for email:', email)
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  console.log('[LOGIN] User found, checking password for email:', email)
  const ok = await bcrypt.compare(password, row.password_hash)
  if (!ok) {
    console.log('[LOGIN] Invalid password for email:', email)
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  console.log('[LOGIN] Successful login for email:', email)
  const session = await createSession(row.id)
  setSessionCookie(event, session.token, 30 * 24 * 60 * 60)

  return { ok: true, user: { id: row.id, email: row.email } }
})

