import { mongoDb } from '../../../utils/mongo'

export default defineEventHandler(async (event) => {
  const mongo = await mongoDb()

  // Get all products
  const products = await mongo.collection('products').find({}).toArray()
  
  if (!products.length) {
    return { message: 'No products found', initialized: 0 }
  }

  // Get all stores
  const stores = await mongo.collection('stores').find({}).toArray()
  
  if (!stores.length) {
    return { message: 'No stores found', initialized: 0 }
  }

  const now = Date.now()
  let initialized = 0

  // For each product, generate prices for all stores
  for (const product of products) {
    for (const store of stores) {
      const existing = await mongo.collection('prices').findOne({
        product_id: product.id,
        store_id: store.id
      })

      // Only initialize if price doesn't exist
      if (!existing) {
        const newPrice = Math.floor(Math.random() * 10000) + 100 // 1-100 EUR in cents
        
        await mongo.collection('prices').updateOne(
          { product_id: product.id, store_id: store.id },
          {
            $set: {
              product_id: product.id,
              store_id: store.id,
              store_price: newPrice,
              old_price: null,
              timestamp: now
            }
          },
          { upsert: true }
        )
        
        initialized++
      }
    }
  }

  return {
    message: 'Prices initialization complete',
    products_count: products.length,
    stores_count: stores.length,
    initialized_prices: initialized,
    total_expected: products.length * stores.length
  }
})
