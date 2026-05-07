import { defineEventHandler, createError } from 'h3'
import { mongoDb } from '../../utils/mongo'
import { getUserById, getUserIdFromEvent } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getUserIdFromEvent(event)
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })

  const me = await getUserById(userId)
  if (!me || !me.is_admin) throw createError({ statusCode: 403, statusMessage: 'Admin only' })

  const mongo = await mongoDb()
  const products = await mongo.collection('products')
    .find({})
    .sort({ category_name: 1, subcategory_name: 1, name: 1 })
    .toArray()

  return { products }
})
