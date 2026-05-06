import { db } from '../../utils/db'

export default defineEventHandler(() => {
  return db().prepare(`
    SELECT category_slug, category_name, COUNT(*) AS productCount
    FROM products
    GROUP BY category_slug, category_name
    ORDER BY category_name
  `).all() as Array<{ category_slug: string; category_name: string; productCount: number }>
})
