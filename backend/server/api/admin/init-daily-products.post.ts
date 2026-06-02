import { defineEventHandler } from 'h3'
import { mongoDb } from '../../utils/mongo'

export default defineEventHandler(async (event) => {
  const mongo = await mongoDb()
  
  // Create the daily_products collection if it doesn't exist
  const collections = await mongo.listCollections().toArray()
  const exists = collections.some(c => c.name === 'daily_products')
  
  if (!exists) {
    await mongo.createCollection('daily_products')
    await mongo.collection('daily_products').createIndex({ date: 1 }, { unique: true })
  }
  
  return { success: true, message: 'Daily products collection initialized' }
})
