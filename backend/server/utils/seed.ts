import { migrate } from './migrate'
import { db } from './db'
import { generateCatalog } from '~/utils/catalogGenerator'
import bcrypt from 'bcryptjs'
import { id } from './ids'
import { mongoDb } from './mongo'

function nowMs() {
  return Date.now()
}

function metaGet(key: string) {
  const row = db().prepare('SELECT value FROM meta WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

function metaSet(key: string, value: string) {
  db().prepare('INSERT INTO meta(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, value)
}

export async function seedIfNeeded() {
  migrate()
  const d = db()

  // Always ensure stores + admin exist, even if product seed ran already.
  const seeded = metaGet('seeded_v1')

  const catalog = generateCatalog()

  const insertProduct = d.prepare(`
    INSERT INTO products(id, name, category_slug, category_name, subcategory_slug, subcategory_name, specs_json)
    VALUES (@id, @name, @category_slug, @category_name, @subcategory_slug, @subcategory_name, @specs_json)
  `)

  const insertStore = d.prepare(`
    INSERT INTO stores(id, name, api_base)
    VALUES (@id, @name, @api_base)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, api_base=excluded.api_base
  `)

  const insertMap = d.prepare(`
    INSERT INTO product_store_map(product_id, store_id, external_id)
    VALUES (@product_id, @store_id, @external_id)
    ON CONFLICT(product_id, store_id) DO UPDATE SET external_id=excluded.external_id
  `)

  d.transaction(() => {
    // Stores (fake)
    insertStore.run({ id: 'store-a', name: 'Store A', api_base: '/api/store-a' })
    insertStore.run({ id: 'store-b', name: 'Store B', api_base: '/api/store-b' })
    insertStore.run({ id: 'store-c', name: 'Store C', api_base: '/api/store-c' })

    if (seeded !== '1') {
      for (const category of catalog) {
        for (const sub of category.subcategories) {
          for (const product of sub.products) {
            insertProduct.run({
              id: product.id,
              name: product.name,
              category_slug: category.slug,
              category_name: category.name,
              subcategory_slug: sub.slug,
              subcategory_name: sub.name,
              specs_json: JSON.stringify(product.specs),
            })

            // Each store uses different indexing scheme
            insertMap.run({ product_id: product.id, store_id: 'store-a', external_id: `A-${product.id}` })
            insertMap.run({ product_id: product.id, store_id: 'store-b', external_id: product.id.replace(/-/g, '').toUpperCase() })
            insertMap.run({ product_id: product.id, store_id: 'store-c', external_id: `C:${product.id}:${product.id.length}` })
          }
        }
      }

      metaSet('seeded_v1', '1')
      metaSet('seeded_at', String(nowMs()))
    }

    // Admin user (for "refresh all prices" button)
    const adminEmail = 'admin@local'
    const admin = d.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail) as { id: string } | undefined
    if (!admin) {
      const userId = id('usr')
      const passwordHash = bcrypt.hashSync('admin123', 10)
      d.prepare('INSERT INTO users(id, email, password_hash, created_at, is_admin) VALUES (?, ?, ?, ?, 1)')
        .run(userId, adminEmail, passwordHash, nowMs())
    }
  })()

  const mongo = await mongoDb()
  const collection = mongo.collection('users')
  await collection.updateOne(
    { email: 'admin@local' },
    {
      $setOnInsert: {
        id: id('usr'),
        email: 'admin@local',
        password_hash: bcrypt.hashSync('admin123', 10),
        created_at: nowMs(),
        is_admin: true,
      },
    },
    { upsert: true }
  )
}

