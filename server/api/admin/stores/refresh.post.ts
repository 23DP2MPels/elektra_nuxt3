import type { StoreId } from '~/composables/useCatalog'
import { bumpStoreVersion } from '../../../utils/storePricing'

function toStoreId(store: unknown): StoreId | null {
  const s = String(store || '')
  if (s === 'store-1' || s === 'store-2' || s === 'store-3' || s === 'store-4') return s
  return null
}

export default defineEventHandler(async (event) => {
  const body = (await readBody<{ storeId?: StoreId }>(event).catch(() => undefined)) ?? {}
  const storeId = body.storeId ? toStoreId(body.storeId) : null

  if (storeId) {
    const version = await bumpStoreVersion(storeId)
    return { ok: true, storeId, version }
  }

  const all: StoreId[] = ['store-1', 'store-2', 'store-3', 'store-4']
  const versions: Record<StoreId, number> = {
    'store-1': 0,
    'store-2': 0,
    'store-3': 0,
    'store-4': 0,
  }

  for (const s of all) {
    versions[s] = await bumpStoreVersion(s)
  }

  return { ok: true, versions }
})

