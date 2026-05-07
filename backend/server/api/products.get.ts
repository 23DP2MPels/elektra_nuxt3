import { getQuery } from 'h3'
import { mongoDb } from '../utils/mongo'

export default defineEventHandler(async (event) => {
  const q = String(getQuery(event).q || '').trim().toLowerCase()
  const category = String(getQuery(event).category || '').trim()
  const subcategory = String(getQuery(event).subcategory || '').trim()
  const limit = Math.min(200, Math.max(1, Number(getQuery(event).limit || 50)))

  const mongo = await mongoDb()
  let query: any = {}
  let sort: any = { category_name: 1, subcategory_name: 1, name: 1 }

  if (category) {
    query.category_slug = category
    if (subcategory) {
      query.subcategory_slug = subcategory
      sort = { name: 1 }
    } else {
      sort = { subcategory_name: 1, name: 1 }
    }
  }

  if (q) {
    query.name = { $regex: q, $options: 'i' }
  }

  const pipeline: any[] = []
  if (Object.keys(query).length) {
    pipeline.push({ $match: query })
  }

  pipeline.push({
    $lookup: {
      from: 'prices',
      localField: 'id',
      foreignField: 'product_id',
      as: 'prices'
    }
  })

  pipeline.push({
    $addFields: {
      price_min: { $min: '$prices.store_price' },
      price_max: { $max: '$prices.store_price' }
    }
  })

  pipeline.push({
    $project: {
      prices: 0
    }
  })

  pipeline.push({ $sort: sort })
  pipeline.push({ $limit: limit })

  const products = await mongo.collection('products')
    .aggregate(pipeline)
    .toArray()

  return products
})

