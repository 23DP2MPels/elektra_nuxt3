import { fakeStorePriceCents } from '../../utils/pricing'

export default defineEventHandler((event) => {
  const externalId = String(getQuery(event).id || '').trim()
  if (!externalId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing query param: id' })
  }

  // Simulate random-ish outage: ids with even length fail
  if (externalId.length % 2 === 0) {
    throw createError({ statusCode: 503, statusMessage: 'Store C maintenance window' })
  }

  const priceCents = fakeStorePriceCents({ storeId: 'store-c', externalId, currency: 'EUR' })
  return { store: 'store-c', externalId, currency: 'EUR', priceCents }
})

