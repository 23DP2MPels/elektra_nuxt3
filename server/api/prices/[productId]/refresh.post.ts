import { refreshPricesForProduct } from '../../../utils/pricesService'

export default defineEventHandler(async (event) => {
  const productId = String(getRouterParam(event, 'productId') || '')
  if (!productId) throw createError({ statusCode: 400, statusMessage: 'Missing productId' })

  await refreshPricesForProduct(event, productId)
  return { ok: true }
})

