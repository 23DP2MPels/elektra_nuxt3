import { getCatalogIndex } from '../../utils/catalogIndex'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const categorySlug = String(q.category || '')
  const subcategorySlug = String(q.subcategory || '')

  if (!categorySlug || !subcategorySlug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing category/subcategory' })
  }

  const { catalog } = getCatalogIndex()
  const category = catalog.find(c => c.slug === categorySlug)
  const subcategory = category?.subcategories.find(s => s.slug === subcategorySlug)

  if (!category || !subcategory) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown category/subcategory' })
  }

  const items: Array<{
    productId: string
    minPrice: number
    currency: string
    stores: number
  }> = []

  for (const p of subcategory.products) {
    const data = await event.$fetch<{
      offers: Array<{ price: number; currency: string }>
    }>(`/api/prices/${p.id}`)

    // Every product should have at least 1 offer (we guarantee storeSkus >= 2)
    const offers = data.offers || []
    const min = offers.reduce((acc, o) => Math.min(acc, o.price), Number.POSITIVE_INFINITY)
    const currency = offers[0]?.currency || 'EUR'

    items.push({
      productId: p.id,
      minPrice: Number.isFinite(min) ? min : 0,
      currency,
      stores: offers.length,
    })
  }

  return {
    categorySlug,
    subcategorySlug,
    updatedAt: new Date().toISOString(),
    items,
  }
})

