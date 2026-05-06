import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db } from '../../utils/db'
import { mongoDb } from '../../utils/mongo'
import { getUserIdFromEvent } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getUserIdFromEvent(event)
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })

  const productId = String(getRouterParam(event, 'productId') || '')
  if (!productId) throw createError({ statusCode: 400, statusMessage: 'Missing productId' })

  const product = db().prepare('SELECT id FROM products WHERE id = ?').get(productId)
  if (!product) throw createError({ statusCode: 404, statusMessage: 'Product not found' })

  const mongo = await mongoDb()
  await mongo.collection('favorited_items').updateOne(
    { user_id: userId, product_id: productId },
    { $set: { user_id: userId, product_id: productId, created_at: Date.now() } },
    { upsert: true }
  )

  return { ok: true }
})

