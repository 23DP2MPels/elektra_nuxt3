import type { StoreId } from '~/composables/useCatalog'

function djb2(str: string) {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
  }
  return hash >>> 0
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export async function getStoreVersion(storeId: StoreId) {
  const storage = useStorage('stores')
  const key = `version:${storeId}`
  const v = (await storage.getItem<number>(key)) ?? 1
  return v
}

export async function bumpStoreVersion(storeId: StoreId) {
  const storage = useStorage('stores')
  const key = `version:${storeId}`
  const v = (await storage.getItem<number>(key)) ?? 1
  const next = v + 1
  await storage.setItem(key, next)
  return next
}

export async function computeStorePrice(opts: {
  storeId: StoreId
  storeSku: string
  currency?: string
}) {
  const currency = opts.currency ?? 'EUR'
  const version = await getStoreVersion(opts.storeId)

  // Base price is stable for SKU+store (so daily updates are a delta)
  const baseSeed = `${opts.storeId}|${opts.storeSku}`
  const baseH = djb2(baseSeed)
  const base = 9.99 + (baseH % 399000) / 100 // 9.99 – 3999.99

  // Daily delta in range [-80.00, +80.00] with cents.
  // Manual refresh changes version => new delta (same day).
  const day = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const deltaSeed = `${opts.storeId}|${opts.storeSku}|${day}|v${version}`
  const deltaH = djb2(deltaSeed)
  const delta = ((deltaH % 16001) - 8000) / 100 // -80.00 .. +80.00

  // Store-specific price bias
  const bias = opts.storeId === 'store-1'
    ? 0.98
    : opts.storeId === 'store-2'
      ? 1.0
      : opts.storeId === 'store-3'
        ? 1.03
        : 1.01

  const price = clamp(Math.round((base + delta) * bias * 100) / 100, 9.99, 3999.99)

  return {
    storeId: opts.storeId,
    storeSku: opts.storeSku,
    currency,
    price,
    asOf: new Date().toISOString(),
    version,
    day,
  }
}

