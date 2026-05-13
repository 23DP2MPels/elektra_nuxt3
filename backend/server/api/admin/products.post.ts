import { defineEventHandler, createError, readBody } from 'h3'
import { mongoDb } from '../../utils/mongo'
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
  const categoryNameRaw = body?.category_name
  const subcategoryNameRaw = body?.subcategory_name
  const imageUrl = String(body?.image_url || '').trim()
  const imageAlt = String(body?.image_alt || '').trim()
  const specsJson = String(body?.specs_json || '{}')

  const buildLocalizedName = (raw: unknown, en: unknown, ru: unknown, lv: unknown) => {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw
    const localized: Record<string, string> = {}
    if (typeof en === 'string' && en.trim()) localized.en = en.trim()
    if (typeof ru === 'string' && ru.trim()) localized.ru = ru.trim()
    if (typeof lv === 'string' && lv.trim()) localized.lv = lv.trim()
    if (Object.keys(localized).length) return localized
    return typeof raw === 'string' ? raw.trim() : ''
  }

  const categoryName = buildLocalizedName(
    categoryNameRaw,
    body?.category_name_en,
    body?.category_name_ru,
    body?.category_name_lv,
  )
  const subcategoryName = buildLocalizedName(
    subcategoryNameRaw,
    body?.subcategory_name_en,
    body?.subcategory_name_ru,
    body?.subcategory_name_lv,
  )

  if (!name || !categorySlug || !categoryName || !subcategorySlug || !subcategoryName) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required product fields' })
  }

  let specs
  try {
    specs = JSON.parse(specsJson)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON in specs' })
  }

  const mongo = await mongoDb()
  await mongo.collection('products').updateOne(
    { id: productId },
    {
      $set: {
        id: productId,
        name,
        category_slug: categorySlug,
        category_name: categoryName,
        subcategory_slug: subcategorySlug,
        subcategory_name: subcategoryName,
        image_url: imageUrl,
        image_alt: imageAlt || name,
        specs_json: JSON.stringify(specs),
      }
    },
    { upsert: true }
  )

  return {
    ok: true,
    product: {
      id: productId,
      name,
      category_slug: categorySlug,
      category_name: categoryName,
      subcategory_slug: subcategorySlug,
      subcategory_name: subcategoryName,
      image_url: imageUrl,
      image_alt: imageAlt || name,
      specs_json: JSON.stringify(specs),
    }
  }
})
