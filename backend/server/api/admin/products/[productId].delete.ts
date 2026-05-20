import { defineEventHandler, createError, getRouterParam } from 'h3'
import { MongoClient } from 'mongodb'
import { getUserById, getUserIdFromEvent } from '../../../utils/auth'

let client: MongoClient | null = null

async function getMongoDb() {
  if (!client) {
    const config = useRuntimeConfig()
    const uri = config.mongodbUri || process.env.MONGODB_URI

    if (!uri) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database configuration missing: MONGODB_URI is not set.'
      })
    }

    client = new MongoClient(uri)
    await client.connect()
  }
  return client.db()
}

export default defineEventHandler(async (event) => {
  // 1. Authenticate user
  const userId = await getUserIdFromEvent(event)
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })

  // 2. Authorize admin status
  const me = await getUserById(userId)
  if (!me || !me.is_admin) throw createError({ statusCode: 403, statusMessage: 'Admin only' })

  // 3. Robust parameter extraction using H3 utility
  // This automatically extracts the parameter whether the file is named [productId].ts or _productId_.ts
  const productId = getRouterParam(event, 'productId')
  if (!productId) throw createError({ statusCode: 400, statusMessage: 'Product id is required' })

  try {
    const database = await getMongoDb()

    // 4. Delete map associations first
    await database.collection('product_store_map').deleteMany({ product_id: productId })

    // 5. Delete the main product document matching the 'id' field string
    const productResult = await database.collection('products').deleteOne({ id: productId })

    if (productResult.deletedCount === 0) {
      throw createError({ statusCode: 404, statusMessage: `Product with id "${productId}" not found in database.` })
    }

    return { ok: true }
    
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Database operation failed: ${error.message}`
    })
  }
})
