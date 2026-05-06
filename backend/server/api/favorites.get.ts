import { db } from '../utils/db'
import { createError } from 'h3'
import { mongoDb } from '../utils/mongo'
import { getUserIdFromEvent } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getUserIdFromEvent(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  const mongo = await mongoDb()
  const favorites = await mongo
    .collection('favorited_items')
    .find({ user_id: userId })
    .sort({ created_at: -1 })
    .toArray()

  const productIds = favorites.map((fav) => fav.product_id).filter(Boolean)
  if (!productIds.length) return []

  const placeholders = productIds.map(() => '?').join(',')
  const products = db()
    .prepare(`
      SELECT id, name, category_slug, category_name, subcategory_slug, subcategory_name
      FROM products
      WHERE id IN (${placeholders})
      ORDER BY name
    `)
    .all(...productIds)

  return products
})

