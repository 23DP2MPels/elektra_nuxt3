import { db } from '../utils/db'
import { getUserIdFromEvent } from '../utils/auth'

export default defineEventHandler((event) => {
  const userId = getUserIdFromEvent(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  return db().prepare(`
    SELECT p.id, p.name, p.category_slug, p.category_name, p.subcategory_slug, p.subcategory_name
    FROM favorites f
    JOIN products p ON p.id = f.product_id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
    LIMIT 200
  `).all(userId)
})

