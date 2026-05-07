import { mongoDb } from './mongo'

export type PriceRow = {
  storeId: string
  storeName: string
  externalId: string
  currency: string
  priceCents: number
  oldPriceCents: number | null
  fetchedAt: number
  ok: boolean
  error: string | null
}

export async function getPriceCache(productId: string): Promise<PriceRow[]> {
  const mongo = await mongoDb()
  const stores = await mongo.collection('stores').find({}).toArray()
  const maps = await mongo.collection('product_store_map').find({ product_id: productId }).toArray()
  const mapByStore = new Map(maps.map(m => [m.store_id, m.external_id] as const))

  const prices = await mongo.collection('prices').find({ product_id: productId }).toArray()

  const byStore = new Map(prices.map(p => [p.store_id, p] as const))

  const now = Date.now()
  const staleThreshold = 24 * 60 * 60 * 1000 // 24 hours

  const results: PriceRow[] = []

  for (const store of stores) {
    const cached = byStore.get(store.id)
    const isStale = !cached || (now - cached.timestamp) > staleThreshold

    let priceCents = cached?.store_price ?? 0
    let oldPriceCents = cached?.old_price ?? null
    let fetchedAt = cached?.timestamp ?? 0
    let ok = cached ? true : false
    let error = null

    if (isStale) {
      // Generate random price
      const newPrice = Math.floor(Math.random() * 10000) + 100 // 1-100 EUR in cents
      const updateData: any = {
        product_id: productId,
        store_id: store.id,
        store_price: newPrice,
        timestamp: now,
      }

      if (cached) {
        updateData.old_price = cached.store_price
      } else {
        updateData.old_price = null
      }

      await mongo.collection('prices').updateOne(
        { product_id: productId, store_id: store.id },
        { $set: updateData },
        { upsert: true }
      )

      priceCents = newPrice
      oldPriceCents = cached?.store_price ?? null
      fetchedAt = now
      ok = true
    }

    results.push({
      storeId: store.id,
      storeName: store.name,
      externalId: mapByStore.get(store.id) ?? '',
      currency: 'EUR',
      priceCents,
      oldPriceCents,
      fetchedAt,
      ok,
      error,
    })
  }

  return results
}

export async function refreshPricesForProduct(event: any, productId: string) {
  // For admin refresh all, perhaps do nothing or refresh all stores for this product
  // But user says not to update all, but for admin button, maybe refresh all for this product
  const mongo = await mongoDb()
  const stores = await mongo.collection('stores').find({}).toArray()

  const now = Date.now()

  for (const store of stores) {
    const existing = await mongo.collection('prices').findOne({ product_id: productId, store_id: store.id })

    const newPrice = Math.floor(Math.random() * 10000) + 100
    const updateData: any = {
      product_id: productId,
      store_id: store.id,
      store_price: newPrice,
      timestamp: now,
    }

    if (existing) {
      updateData.old_price = existing.store_price
    } else {
      updateData.old_price = null
    }

    await mongo.collection('prices').updateOne(
      { product_id: productId, store_id: store.id },
      { $set: updateData },
      { upsert: true }
    )
  }
}

