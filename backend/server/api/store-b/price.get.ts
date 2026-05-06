import { fakeStorePriceCents } from '../../utils/pricing'

export default defineEventHandler((event) => {
  const externalId = String(getQuery(event).id || '').trim()
  if (!externalId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing query param: id' })
  }

  // Different behavior: slower + different outage pattern
  if (externalId.includes('BAD')) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found in Store B' })
  }

  const priceCents = fakeStorePriceCents({ storeId: 'store-b', externalId, currency: 'EUR' })
  return { store: 'store-b', externalId, currency: 'EUR', priceCents }
})

