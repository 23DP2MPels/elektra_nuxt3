import { defineEventHandler, getRouterParam, createError } from 'h3'
import { getPriceCache } from '../../utils/pricesService'

export default defineEventHandler(async (event) => {
  const productId = String(getRouterParam(event, 'productId') || '')

  if (!productId) throw createError({ statusCode: 400, statusMessage: 'Missing productId' })

  const prices = await getPriceCache(productId)

  return {
    productId,
    prices,
  }
})

