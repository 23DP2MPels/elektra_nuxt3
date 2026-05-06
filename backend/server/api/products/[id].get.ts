import { db } from '../../utils/db'

export default defineEventHandler((event) => {
  const id = String(getRouterParam(event, 'id') || '')
  const row = db().prepare(`
    SELECT id, name, category_slug, category_name, subcategory_slug, subcategory_name, specs_json
    FROM products
    WHERE id = ?
  `).get(id) as any

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  return {
    ...row,
    specs: JSON.parse(row.specs_json),
  }
})

