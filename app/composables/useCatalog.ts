export type CatalogCategory = {
  slug: string
  name: string
  subcategories: CatalogSubcategory[]
}

export type CatalogSubcategory = {
  slug: string
  name: string
  products: CatalogProduct[]
}

export type CatalogProduct = {
  id: string
  name: string
  specs: Record<string, string | number | boolean>
  storeSkus: Partial<Record<StoreId, string>>
}

import { generateCatalog } from '~/utils/catalogGenerator'

export type StoreId = 'store-1' | 'store-2' | 'store-3' | 'store-4'

const CATALOG: CatalogCategory[] = generateCatalog()
const PRODUCT_INDEX = new Map<string, { product: CatalogProduct; category: CatalogCategory; subcategory: CatalogSubcategory }>()

for (const category of CATALOG) {
  for (const subcategory of category.subcategories) {
    for (const product of subcategory.products) {
      PRODUCT_INDEX.set(product.id, { product, category, subcategory })
    }
  }
}

const PRODUCT_LIST = Array.from(PRODUCT_INDEX.values())

export function useCatalog() {
  const categories = computed(() => CATALOG)

  function getCategory(slug: string) {
    return CATALOG.find(c => c.slug === slug) ?? null
  }

  function getSubcategory(categorySlug: string, subcategorySlug: string) {
    const category = getCategory(categorySlug)
    if (!category) return null
    return category.subcategories.find(s => s.slug === subcategorySlug) ?? null
  }

  function getProduct(productId: string) {
    return PRODUCT_INDEX.get(productId) ?? null
  }

  function searchProducts(query: string) {
    const q = query.trim().toLowerCase()
    if (!q) return []

    return PRODUCT_LIST.filter(({ product, category, subcategory }) => {
      if (product.name.toLowerCase().includes(q)) return true
      if (category.name.toLowerCase().includes(q)) return true
      if (subcategory.name.toLowerCase().includes(q)) return true

      for (const value of Object.values(product.specs)) {
        if (String(value).toLowerCase().includes(q)) return true
      }
      return false
    })
  }

  return {
    categories,
    getCategory,
    getSubcategory,
    getProduct,
    searchProducts,
  }
}

