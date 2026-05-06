import { fakeStorePriceCents } from '../../utils/pricing'

export default defineEventHandler((event) => {
  const externalId = String(getQuery(event).id || '').trim()
  if (!externalId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing query param: id' })
  }

  // Simulate occasional outage
  if (externalId.endsWith('7')) {
    throw createError({ statusCode: 503, statusMessage: 'Store A temporary unavailable' })
  }

  const priceCents = fakeStorePriceCents({ storeId: 'store-a', externalId, currency: 'EUR' })
  return { store: 'store-a', externalId, currency: 'EUR', priceCents }
})

