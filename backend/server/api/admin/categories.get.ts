import { defineEventHandler, createError } from 'h3'
import { mongoDb } from '../../utils/mongo'
import { getUserById, getUserIdFromEvent } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getUserIdFromEvent(event)
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })

  const me = await getUserById(userId)
  if (!me || !me.is_admin) throw createError({ statusCode: 403, statusMessage: 'Admin only' })

  const mongo = await mongoDb()
  const categories = await mongo.collection('products').aggregate([
    {
      $group: {
        _id: {
          category_slug: '$category_slug',
          category_name: '$category_name',
          subcategory_slug: '$subcategory_slug',
          subcategory_name: '$subcategory_name'
        },
        productCount: { $sum: 1 }
      }
    },
    {
      $project: {
        category_slug: '$_id.category_slug',
        category_name: '$_id.category_name',
        subcategory_slug: '$_id.subcategory_slug',
        subcategory_name: '$_id.subcategory_name',
        productCount: 1,
        _id: 0
      }
    },
    {
      $sort: { category_name: 1, subcategory_name: 1 }
    }
  ]).toArray()

  return { categories }
})
