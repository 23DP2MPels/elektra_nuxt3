import { getCatalogIndex } from '../../utils/catalogIndex'
import type { StoreId } from '~/composables/useCatalog'

type Offer = {
  storeId: StoreId
  storeSku: string
  currency: string
  price: number
  asOf: string
}

const TTL_MS = 24 * 60 * 60 * 1000

export default defineEventHandler(async (event) => {
  const productId = String(getRouterParam(event, 'productId') || '')
  const { byProductId } = getCatalogIndex()
  const ctx = byProductId.get(productId)
  if (!ctx) throw createError({ statusCode: 404, statusMessage: 'Unknown product' })

  const storage = useStorage('prices')
  const cacheKey = `product:${productId}`
  const cached = await storage.getItem<{ updatedAt: string; offers: Offer[] }>(cacheKey)

  const now = Date.now()
  const updatedAtMs = cached ? Date.parse(cached.updatedAt) : 0
  const isFresh = cached && Number.isFinite(updatedAtMs) && (now - updatedAtMs) < TTL_MS

  if (isFresh) {
    return {
      productId,
      updatedAt: cached!.updatedAt,
      offers: cached!.offers,
      cached: true,
    }
  }

  const offers: Offer[] = []
  const storeSkus = ctx.product.storeSkus
  const storeIds = Object.keys(storeSkus) as StoreId[]

  for (const storeId of storeIds) {
    const storeSku = storeSkus[storeId]
    if (!storeSku) continue

    // “Store API” call (internal, stable in Nitro)
    const data = await event.$fetch<{ price: number; currency: string; asOf: string }>(
      `/api/stores/${storeId}/price`,
      { query: { sku: storeSku } },
    )

    offers.push({
      storeId,
      storeSku,
      currency: data.currency,
      price: data.price,
      asOf: data.asOf,
    })
  }

  const updatedAt = new Date().toISOString()
  await storage.setItem(cacheKey, { updatedAt, offers })

  return {
    productId,
    updatedAt,
    offers,
    cached: false,
  }
})

