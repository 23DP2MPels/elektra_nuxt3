import { defineEventHandler } from 'h3'
import { getUserIdFromEvent, getUserById } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getUserIdFromEvent(event)
  if (!userId) return { user: null }

  const user = await getUserById(userId)
  if (!user) return { user: null }

  return { user: { id: user.id, email: user.email, is_admin: Boolean(user.is_admin) } }
})

