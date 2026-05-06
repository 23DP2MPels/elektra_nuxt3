import { db } from '../../utils/db'
import { getUserIdFromEvent } from '../../utils/auth'

export default defineEventHandler((event) => {
  const userId = getUserIdFromEvent(event)
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })

  const productId = String(getRouterParam(event, 'productId') || '')
  if (!productId) throw createError({ statusCode: 400, statusMessage: 'Missing productId' })

  db().prepare('DELETE FROM favorites WHERE user_id = ? AND product_id = ?').run(userId, productId)
  return { ok: true }
})

