import { createError } from 'h3'
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

  const products = await mongo.collection('products')
    .find({ id: { $in: productIds } })
    .sort({ name: 1 })
    .toArray()

  return products
})

