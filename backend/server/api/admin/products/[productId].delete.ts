import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db } from '../../../utils/db'
import { getUserById, getUserIdFromEvent } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getUserIdFromEvent(event)
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })

  const me = await getUserById(userId)
  if (!me || !me.is_admin) throw createError({ statusCode: 403, statusMessage: 'Admin only' })

  const { productId } = event.context.params as { productId: string }
  if (!productId) throw createError({ statusCode: 400, statusMessage: 'Product id is required' })

  db().prepare('DELETE FROM products WHERE id = ?').run(productId)
  db().prepare('DELETE FROM product_store_map WHERE product_id = ?').run(productId)

  return { ok: true }
})
