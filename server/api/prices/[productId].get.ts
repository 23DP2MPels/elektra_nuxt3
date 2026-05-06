import { getPriceCache, refreshPricesForProduct, shouldRefreshProduct } from '../../utils/pricesService'

export default defineEventHandler(async (event) => {
  const productId = String(getRouterParam(event, 'productId') || '')
  const intervalHours = Number(getQuery(event).intervalHours || 24)

  if (!productId) throw createError({ statusCode: 400, statusMessage: 'Missing productId' })

  // Auto-refresh if too old (default once per 24h)
  if (intervalHours > 0 && shouldRefreshProduct(productId, intervalHours)) {
    await refreshPricesForProduct(event, productId)
  }

  return {
    productId,
    prices: getPriceCache(productId),
  }
})

