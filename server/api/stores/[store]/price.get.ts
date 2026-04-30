import type { StoreId } from '~/composables/useCatalog'
import { computeStorePrice } from '../../../utils/storePricing'

function toStoreId(store: string): StoreId | null {
  if (store === 'store-1' || store === 'store-2' || store === 'store-3' || store === 'store-4') return store
  return null
}

export default defineEventHandler(async (event) => {
  const storeParam = String(getRouterParam(event, 'store') || '')
  const storeId = toStoreId(storeParam)
  if (!storeId) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown store' })
  }

  const storeSku = String(getQuery(event).sku || '').trim()
  if (!storeSku) {
    throw createError({ statusCode: 400, statusMessage: 'Missing sku' })
  }

  return await computeStorePrice({ storeId, storeSku })
})

