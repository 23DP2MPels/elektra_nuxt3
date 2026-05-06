import { defineEventHandler, getCookie, deleteCookie } from 'h3'
import { clearSessionCookie, deleteSession } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'session')
  if (token) {
    await deleteSession(token)
  }
  clearSessionCookie(event)
  return { ok: true }
})

