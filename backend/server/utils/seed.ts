import {  } from './catalogGenerator'
import bcrypt from 'bcryptjs'
import { id } from './ids'
import { mongoDb } from './mongo'

function nowMs() {
  return Date.now()
}

export async function seedIfNeeded() {
  const mongo = await mongoDb()

  // Check if seeded
  const setting = await mongo.collection('setting').findOne({ key: 'seeded_v1' })
  if (setting?.value === '1') return

  const catalog = generateCatalog()

  // Seed stores
  const stores = [
    { id: 'store-a', name: 'Store A', api_base: '/api/store-a' },
    { id: 'store-b', name: 'Store B', api_base: '/api/store-b' },
    { id: 'store-c', name: 'Store C', api_base: '/api/store-c' },
  ]
  for (const store of stores) {
    await mongo.collection('stores').updateOne(
      { id: store.id },
      { $set: store },
      { upsert: true }
    )
  }

  // Seed products and mappings
  for (const category of catalog) {
    for (const sub of category.subcategories) {
      for (const product of sub.products) {
        await mongo.collection('products').updateOne(
          { id: product.id },
          {
            $set: {
              id: product.id,
              name: product.name,
              category_slug: category.slug,
              category_name: category.name,
              subcategory_slug: sub.slug,
              subcategory_name: sub.name,
              image_alt: product.name,
              specs_json: JSON.stringify(product.specs),
            }
          },
          { upsert: true }
        )

        // Mappings
        const mappings = [
          { product_id: product.id, store_id: 'store-a', external_id: `A-${product.id}` },
          { product_id: product.id, store_id: 'store-b', external_id: product.id.replace(/-/g, '').toUpperCase() },
          { product_id: product.id, store_id: 'store-c', external_id: `C:${product.id}:${product.id.length}` },
        ]
        for (const map of mappings) {
          await mongo.collection('product_store_map').updateOne(
            { product_id: map.product_id, store_id: map.store_id },
            { $set: map },
            { upsert: true }
          )
        }
      }
    }
  }

  // Admin user
  const adminEmail = 'admin@local'
  const existingAdmin = await mongo.collection('users').findOne({ email: adminEmail })
  if (!existingAdmin) {
    const userId = id('usr')
    const passwordHash = await bcrypt.hash('admin123', 10)
    await mongo.collection('users').insertOne({
      id: userId,
      email: adminEmail,
      password_hash: passwordHash,
      created_at: nowMs(),
      is_admin: true,
    })
  }

  // Mark seeded
  await mongo.collection('setting').updateOne(
    { key: 'seeded_v1' },
    { $set: { value: '1' } },
    { upsert: true }
  )
  await mongo.collection('setting').updateOne(
    { key: 'seeded_at' },
    { $set: { value: String(nowMs()) } },
    { upsert: true }
  )
}

