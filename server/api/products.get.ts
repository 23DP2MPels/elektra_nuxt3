import { db } from '../utils/db'

export default defineEventHandler((event) => {
  const q = String(getQuery(event).q || '').trim().toLowerCase()
  const limit = Math.min(200, Math.max(1, Number(getQuery(event).limit || 50)))

  if (!q) {
    return db().prepare(`
      SELECT id, name, category_slug, category_name, subcategory_slug, subcategory_name
      FROM products
      LIMIT ?
    `).all(limit)
  }

  return db().prepare(`
    SELECT id, name, category_slug, category_name, subcategory_slug, subcategory_name
    FROM products
    WHERE LOWER(name) LIKE ?
    LIMIT ?
  `).all(`%${q}%`, limit)
})

