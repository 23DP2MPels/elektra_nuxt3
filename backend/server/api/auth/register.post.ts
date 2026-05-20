import { defineEventHandler, createError, readBody, setCookie } from 'h3'
import bcrypt from 'bcryptjs'
import { id } from '../../utils/ids'
import { createSession, setSessionCookie, createUser, getUserByEmail } from '../../utils/auth'

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
  if (!password.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Password cannot be only spaces' })
  }
  if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/.test(password)) {
    throw createError({ statusCode: 400, statusMessage: 'Password contains invalid characters' })
  }

  const existing = await getUserByEmail(email)
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Email already registered' })
  }

  const userId = id('usr')
  const passwordHash = await bcrypt.hash(password, 10)
  const now = Date.now()

  await createUser({ id: userId, email, password_hash: passwordHash, created_at: now, is_admin: false })

  const session = await createSession(userId)
  setSessionCookie(event, session.token, 30 * 24 * 60 * 60)

  return { ok: true, user: { id: userId, email } }
})

