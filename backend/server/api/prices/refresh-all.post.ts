import { defineEventHandler, createError, getQuery } from 'h3'
import { mongoDb } from '../../utils/mongo'
import { getUserById, getUserIdFromEvent } from '../../utils/auth'
import { refreshPricesForProduct } from '../../utils/pricesService'

export default defineEventHandler(async (event) => {
  const userId = await getUserIdFromEvent(event)
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })

  const me = await getUserById(userId)
  if (!me || !me.is_admin) throw createError({ statusCode: 403, statusMessage: 'Admin only' })

  const mongo = await mongoDb()
  const limit = Math.min(500, Math.max(1, Number(getQuery(event).limit || 200)))
  const products = await mongo.collection('products').find({}).limit(limit).toArray()

  let ok = 0
  for (const p of products) {
    await refreshPricesForProduct(event, p.id)
    ok++
  }

  return { ok: true, refreshedProducts: ok, limit }
})

