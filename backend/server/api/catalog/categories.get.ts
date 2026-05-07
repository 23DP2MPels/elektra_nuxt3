import { defineEventHandler } from 'h3'
import { mongoDb } from '../../utils/mongo'

export default defineEventHandler(async () => {
  const mongo = await mongoDb()
  const categories = await mongo.collection('products').aggregate([
    {
      $group: {
        _id: { category_slug: '$category_slug', category_name: '$category_name' },
        productCount: { $sum: 1 }
      }
    },
    {
      $project: {
        category_slug: '$_id.category_slug',
        category_name: '$_id.category_name',
        productCount: 1,
        _id: 0
      }
    },
    { $sort: { category_name: 1 } }
  ]).toArray()

  return categories
})
