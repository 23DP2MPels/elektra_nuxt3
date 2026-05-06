import { db } from '../../utils/db'

export default defineEventHandler((event) => {
  const category = String(getQuery(event).category || '').trim()
  if (!category) {
    throw createError({ statusCode: 400, statusMessage: 'category is required' })
  }

  const rows = db().prepare(`
    SELECT subcategory_slug, subcategory_name, COUNT(*) AS productCount, category_name
    FROM products
    WHERE category_slug = ?
    GROUP BY subcategory_slug, subcategory_name
    ORDER BY subcategory_name
  `).all(category) as Array<{ subcategory_slug: string; subcategory_name: string; productCount: number; category_name: string }>

  const categoryName = rows.length ? rows[0].category_name : null
  return {
    category_slug: category,
    category_name: categoryName || category,
    subcategories: rows.map(({ subcategory_slug, subcategory_name, productCount }) => ({ subcategory_slug, subcategory_name, productCount })),
  }
})
