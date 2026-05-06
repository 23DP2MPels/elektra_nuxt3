import { defineEventHandler, createError, getRouterParam } from 'h3'
import { mongoDb } from '../../utils/mongo'
import { getUserIdFromEvent } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getUserIdFromEvent(event)
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })

  const productId = String(getRouterParam(event, 'productId') || '')
  if (!productId) throw createError({ statusCode: 400, statusMessage: 'Missing productId' })

  const mongo = await mongoDb()
  await mongo.collection('favorited_items').deleteOne({ user_id: userId, product_id: productId })
  return { ok: true }
})

