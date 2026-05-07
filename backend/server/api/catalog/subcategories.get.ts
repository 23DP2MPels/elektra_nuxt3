import { getQuery, createError } from 'h3'
import { mongoDb } from '../../utils/mongo'

export default defineEventHandler(async (event) => {
  const category = String(getQuery(event).category || '').trim()
  if (!category) {
    throw createError({ statusCode: 400, statusMessage: 'category is required' })
  }

  const mongo = await mongoDb()
  const rows = await mongo.collection('products').aggregate([
    { $match: { category_slug: category } },
    {
      $group: {
        _id: { subcategory_slug: '$subcategory_slug', subcategory_name: '$subcategory_name', category_name: '$category_name' },
        productCount: { $sum: 1 }
      }
    },
    {
      $project: {
        subcategory_slug: '$_id.subcategory_slug',
        subcategory_name: '$_id.subcategory_name',
        category_name: '$_id.category_name',
        productCount: 1,
        _id: 0
      }
    },
    { $sort: { subcategory_name: 1 } }
  ]).toArray()

  const categoryName = rows.length ? rows[0].category_name : null
  return {
    category_slug: category,
    category_name: categoryName || category,
    subcategories: rows.map(({ subcategory_slug, subcategory_name, productCount }) => ({ subcategory_slug, subcategory_name, productCount })),
  }
})
