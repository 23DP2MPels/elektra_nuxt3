import { getCatalogIndex } from '../../../utils/catalogIndex'

export default defineEventHandler(async (event) => {
  const body = (await readBody<{ productId?: string }>(event).catch(() => undefined)) ?? {}
  const productId = body.productId ? String(body.productId) : ''

  const storage = useStorage('prices')

  if (productId) {
    await storage.removeItem(`product:${productId}`)
    return { ok: true, productId, cleared: true }
  }

  const { byProductId } = getCatalogIndex()
  for (const id of byProductId.keys()) {
    await storage.removeItem(`product:${id}`)
  }

  return { ok: true, clearedAll: true, count: byProductId.size }
})

