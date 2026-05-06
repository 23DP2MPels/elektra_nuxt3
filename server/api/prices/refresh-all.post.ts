import { db } from '../../utils/db'
import { getUserIdFromEvent } from '../../utils/auth'
import { refreshPricesForProduct } from '../../utils/pricesService'

export default defineEventHandler(async (event) => {
  const userId = getUserIdFromEvent(event)
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })

  const me = db().prepare('SELECT is_admin FROM users WHERE id = ?').get(userId) as { is_admin: 0 | 1 } | undefined
  if (!me || me.is_admin !== 1) throw createError({ statusCode: 403, statusMessage: 'Admin only' })

  const limit = Math.min(500, Math.max(1, Number(getQuery(event).limit || 200)))
  const products = db().prepare('SELECT id FROM products LIMIT ?').all(limit) as Array<{ id: string }>

  let ok = 0
  for (const p of products) {
    await refreshPricesForProduct(event, p.id)
    ok++
  }

  return { ok: true, refreshedProducts: ok, limit }
})

