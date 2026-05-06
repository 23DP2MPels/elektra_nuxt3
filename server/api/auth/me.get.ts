import { db } from '../../utils/db'
import { getUserIdFromEvent } from '../../utils/auth'

export default defineEventHandler((event) => {
  const userId = getUserIdFromEvent(event)
  if (!userId) return { user: null }

  const row = db().prepare('SELECT id, email FROM users WHERE id = ?').get(userId) as { id: string; email: string } | undefined
  if (!row) return { user: null }

  return { user: row }
})

