import { db } from '../../utils/db'
import { clearSessionCookie } from '../../utils/auth'

export default defineEventHandler((event) => {
  const token = getCookie(event, 'session')
  if (token) {
    db().prepare('DELETE FROM sessions WHERE token = ?').run(token)
  }
  clearSessionCookie(event)
  return { ok: true }
})

