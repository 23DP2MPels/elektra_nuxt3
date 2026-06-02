import { defineEventHandler } from 'h3'
import { mongoDb } from '../../utils/mongo'

export default defineEventHandler(async (event) => {
  const mongo = await mongoDb()
  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Check if we have cached daily product IDs that are less than 24 hours old
  const cached = await mongo.collection('daily_products').findOne({
    date: { $gte: twentyFourHoursAgo }
  })

  let productIds: string[] = []

  if (cached && cached.productIds && cached.productIds.length > 0) {
    // Use cached product IDs
    productIds = cached.productIds
  } else {
    // Generate new random product IDs
    const randomProducts = await mongo.collection('products')
      .aggregate([{ $sample: { size: 20 } }])
      .project({ id: 1, _id: 0 })
      .toArray()
    
    productIds = randomProducts.map(p => p.id)

    // Cache only the product IDs
    await mongo.collection('daily_products').deleteMany({})
    await mongo.collection('daily_products').insertOne({
      date: now,
      productIds: productIds
    })
  }

  // Fetch fresh product data with current prices for the cached IDs
  const pipeline: any[] = [
    {
      $match: { id: { $in: productIds } }
    },
    {
      $lookup: {
        from: 'prices',
        localField: 'id',
        foreignField: 'product_id',
        as: 'prices'
      }
    },
    {
      $addFields: {
        price_min: { $min: '$prices.store_price' },
        price_max: { $max: '$prices.store_price' }
      }
    },
    {
      $project: {
        _id: 0,
        prices: 0,
      }
    }
  ]

  const products = await mongo.collection('products')
    .aggregate(pipeline)
    .toArray()

  // Sort products to match the cached order
  const productsMap = new Map(products.map(p => [p.id, p]))
  const sortedProducts = productIds.map(id => productsMap.get(id)).filter(p => p !== undefined)

  return sortedProducts
})
