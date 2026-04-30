import { generateCatalog } from '~/utils/catalogGenerator'
import type { CatalogCategory, CatalogProduct, CatalogSubcategory } from '~/composables/useCatalog'

type ProductContext = {
  product: CatalogProduct
  category: CatalogCategory
  subcategory: CatalogSubcategory
}

let cached:
  | {
      catalog: CatalogCategory[]
      byProductId: Map<string, ProductContext>
    }
  | null = null

export function getCatalogIndex() {
  if (cached) return cached

  const catalog: CatalogCategory[] = generateCatalog()
  const byProductId = new Map<string, ProductContext>()

  for (const category of catalog) {
    for (const subcategory of category.subcategories) {
      for (const product of subcategory.products) {
        byProductId.set(product.id, { product, category, subcategory })
      }
    }
  }

  cached = { catalog, byProductId }
  return cached
}

