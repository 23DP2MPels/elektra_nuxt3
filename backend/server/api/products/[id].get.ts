import { defineEventHandler, getRouterParam, createError } from 'h3'
import { mongoDb } from '../../utils/mongo'

export default defineEventHandler(async (event) => {
  const id = String(getRouterParam(event, 'id') || '')
  const mongo = await mongoDb()
  const row = await mongo.collection('products').findOne({ id })

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  return {
    id: row.id,
    name: row.name,
    category_slug: row.category_slug,
    subcategory_slug: row.subcategory_slug,
    specs_json: row.specs_json,
    specs: JSON.parse(row.specs_json),
  }
})

