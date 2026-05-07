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
  const categoryName = String(body?.category_name || '').trim()
  const subcategorySlug = String(body?.subcategory_slug || '').trim()
  const subcategoryName = String(body?.subcategory_name || '').trim()
  const imageUrl = String(body?.image_url || '').trim()
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
      specs_json: JSON.stringify(specs),
    }
  }
})
