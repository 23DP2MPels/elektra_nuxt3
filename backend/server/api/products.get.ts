import { db } from '../utils/db'

export default defineEventHandler((event) => {
  const q = String(getQuery(event).q || '').trim().toLowerCase()
  const category = String(getQuery(event).category || '').trim()
  const subcategory = String(getQuery(event).subcategory || '').trim()
  const limit = Math.min(200, Math.max(1, Number(getQuery(event).limit || 50)))

  if (category) {
    if (subcategory) {
      return db().prepare(`
        SELECT id, name, category_slug, category_name, subcategory_slug, subcategory_name, specs_json
        FROM products
        WHERE category_slug = ? AND subcategory_slug = ?
        ORDER BY name
        LIMIT ?
      `).all(category, subcategory, limit)
    }

    return db().prepare(`
      SELECT id, name, category_slug, category_name, subcategory_slug, subcategory_name, specs_json
      FROM products
      WHERE category_slug = ?
      ORDER BY subcategory_name, name
      LIMIT ?
    `).all(category, limit)
  }

  if (!q) {
    return db().prepare(`
      SELECT id, name, category_slug, category_name, subcategory_slug, subcategory_name, specs_json
      FROM products
      ORDER BY category_name, subcategory_name, name
      LIMIT ?
    `).all(limit)
  }

  return db().prepare(`
    SELECT id, name, category_slug, category_name, subcategory_slug, subcategory_name, specs_json
    FROM products
    WHERE LOWER(name) LIKE ?
    ORDER BY category_name, subcategory_name, name
    LIMIT ?
  `).all(`%${q}%`, limit)
})

