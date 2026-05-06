import { db } from '../../utils/db'
import { getUserIdFromEvent } from '../../utils/auth'

export default defineEventHandler((event) => {
  const userId = getUserIdFromEvent(event)
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })

  const productId = String(getRouterParam(event, 'productId') || '')
  if (!productId) throw createError({ statusCode: 400, statusMessage: 'Missing productId' })

  const now = Date.now()
  db().prepare(`
    INSERT INTO favorites(user_id, product_id, created_at)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, product_id) DO NOTHING
  `).run(userId, productId, now)

  return { ok: true }
})

