import { defineEventHandler, createError } from 'h3'
import { db } from '../../utils/db'
import { getUserById, getUserIdFromEvent } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getUserIdFromEvent(event)
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })

  const me = await getUserById(userId)
  if (!me || !me.is_admin) throw createError({ statusCode: 403, statusMessage: 'Admin only' })

  const categories = db()
    .prepare(
      `SELECT category_slug, category_name, subcategory_slug, subcategory_name, COUNT(*) AS productCount
       FROM products
       GROUP BY category_slug, category_name, subcategory_slug, subcategory_name
       ORDER BY category_name, subcategory_name`
    )
    .all() as Array<{ category_slug: string; category_name: string; subcategory_slug: string; subcategory_name: string; productCount: number }>

  return { categories }
})
