import { defineEventHandler, createError, readBody } from 'h3'
import { db } from '../../utils/db'
import { getUserById, getUserIdFromEvent } from '../../utils/auth'
import { id } from '../../utils/ids'

export default defineEventHandler(async (event) => {
  const userId = await getUserIdFromEvent(event)
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })

  const me = await getUserById(userId)
  if (!me || !me.is_admin) throw createError({ statusCode: 403, statusMessage: 'Admin only' })

  const body = await readBody(event).catch(() => ({}))
  const productId = String(body?.id || '').trim() || id('prd')
  const name = String(body?.name || '').trim()
  const categorySlug = String(body?.category_slug || '').trim()
  const categoryName = String(body?.category_name || '').trim()
  const subcategorySlug = String(body?.subcategory_slug || '').trim()
  const subcategoryName = String(body?.subcategory_name || '').trim()
  const specsJson = String(body?.specs_json || '{}')

  if (!name || !categorySlug || !categoryName || !subcategorySlug || !subcategoryName) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required product fields' })
  }

  let specs
  try {
    specs = JSON.parse(specsJson)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON in specs' })
  }

  db().prepare(
    `INSERT INTO products (id, name, category_slug, category_name, subcategory_slug, subcategory_name, specs_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       category_slug = excluded.category_slug,
       category_name = excluded.category_name,
       subcategory_slug = excluded.subcategory_slug,
       subcategory_name = excluded.subcategory_name,
       specs_json = excluded.specs_json`
  ).run(productId, name, categorySlug, categoryName, subcategorySlug, subcategoryName, JSON.stringify(specs))

  return { ok: true, product: { id: productId, name, category_slug: categorySlug, category_name: categoryName, subcategory_slug: subcategorySlug, subcategory_name: subcategoryName, specs_json: JSON.stringify(specs) } }
})
