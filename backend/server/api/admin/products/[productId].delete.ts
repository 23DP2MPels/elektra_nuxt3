import { defineEventHandler, createError } from 'h3'
import { MongoClient } from 'mongodb'
import { getUserById, getUserIdFromEvent } from '../../../utils/auth'

// Cache the database client connection across requests so it stays fast
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
  // This automatically uses the default database specified in your connection URI string
  return client.db()
}

export default defineEventHandler(async (event) => {
  // 1. Authenticate user
  const userId = await getUserIdFromEvent(event)
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })

  // 2. Authorize admin status
  const me = await getUserById(userId)
  if (!me || !me.is_admin) throw createError({ statusCode: 403, statusMessage: 'Admin only' })

  // 3. Validate incoming parameters
  const { productId } = event.context.params as { productId: string }
  if (!productId) throw createError({ statusCode: 400, statusMessage: 'Product id is required' })

  try {
    const database = await getMongoDb()

    // 4. Delete map associations from the store map collection
    await database.collection('product_store_map').deleteMany({ product_id: productId })

    // 5. Delete the main product document
    const productResult = await database.collection('products').deleteOne({ id: productId })

    if (productResult.deletedCount === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Product not found' })
    }

    return { ok: true }
    
  } catch (error: any) {
    // Prevent 500 crashes by capturing unexpected engine issues cleanly
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Database operation failed: ${error.message}`
    })
  }
})
