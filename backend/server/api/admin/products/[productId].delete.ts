import { defineEventHandler, createError, getRouterParam } from 'h3'
import { MongoClient } from 'mongodb'

let client: MongoClient | null = null

async function getMongoDb() {
  if (!client) {
    const config = useRuntimeConfig()
    // 1. Get the connection string URI
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

  // 2. Read your MONGODB_DB environment variable directly, falling back safely to 'elektra_db'
  const dbName = process.env.MONGODB_DB || 'elektra_db'
  
  // 3. Force the client to use that exact database name instead of defaulting to 'test'
  return client.db(dbName)
}

export default defineEventHandler(async (event) => {
  const productId = getRouterParam(event, 'productId')
  
  // ─── CRITICAL SERVER LOGS ──────────────────────────────────────────
  console.log('👉 RECEIVED PRODUCT ID FROM URL:', productId)
  // ───────────────────────────────────────────────────────────────────

  if (!productId) throw createError({ statusCode: 400, statusMessage: 'Product id is required' })

  try {
    const database = await getMongoDb()
    
    // ─── CRITICAL DATABASE LOGS ──────────────────────────────────────
    console.log('👉 CONNECTED TO DB NAME:', database.databaseName)
    // ───────────────────────────────────────────────────────────────────

    await database.collection('product_store_map').deleteMany({ product_id: productId })
    const productResult = await database.collection('products').deleteOne({ id: productId })

    console.log('👉 MONGO DELETION RESULT:', productResult)

    if (productResult.deletedCount === 0) {
      throw createError({ 
        statusCode: 404, 
        statusMessage: `Product with id "${productId}" not found in database "${database.databaseName}".` 
      })
    }

    return { ok: true }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Database error: ${error.message}`
    })
  }
})
