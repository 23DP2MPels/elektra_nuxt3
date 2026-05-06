import { db } from './db'

type StoreRow = { id: string; name: string; api_base: string }
type MapRow = { store_id: string; external_id: string }

export type PriceRow = {
  storeId: string
  storeName: string
  externalId: string
  currency: string
  priceCents: number
  fetchedAt: number
  ok: boolean
  error: string | null
}

export function getPriceCache(productId: string): PriceRow[] {
  const d = db()
  const stores = d.prepare('SELECT id, name, api_base FROM stores').all() as StoreRow[]
  const maps = d.prepare('SELECT store_id, external_id FROM product_store_map WHERE product_id = ?').all(productId) as MapRow[]

  const mapByStore = new Map(maps.map(m => [m.store_id, m.external_id] as const))

  const rows = d.prepare(`
    SELECT store_id, price_cents, currency, fetched_at, ok, error
    FROM prices
    WHERE product_id = ?
  `).all(productId) as { store_id: string; price_cents: number; currency: string; fetched_at: number; ok: 0 | 1; error: string | null }[]

  const byStore = new Map(rows.map(r => [r.store_id, r] as const))

  return stores.map((s) => {
    const cached = byStore.get(s.id)
    return {
      storeId: s.id,
      storeName: s.name,
      externalId: mapByStore.get(s.id) ?? '',
      currency: cached?.currency ?? 'EUR',
      priceCents: cached?.price_cents ?? 0,
      fetchedAt: cached?.fetched_at ?? 0,
      ok: cached ? cached.ok === 1 : false,
      error: cached?.error ?? null,
    }
  })
}

export async function refreshPricesForProduct(event: any, productId: string) {
  const d = db()
  const stores = d.prepare('SELECT id, api_base FROM stores').all() as { id: string; api_base: string }[]
  const maps = d.prepare('SELECT store_id, external_id FROM product_store_map WHERE product_id = ?').all(productId) as MapRow[]
  const mapByStore = new Map(maps.map(m => [m.store_id, m.external_id] as const))

  const upsert = d.prepare(`
    INSERT INTO prices(product_id, store_id, price_cents, currency, fetched_at, ok, error)
    VALUES (@product_id, @store_id, @price_cents, @currency, @fetched_at, @ok, @error)
    ON CONFLICT(product_id, store_id) DO UPDATE SET
      price_cents=excluded.price_cents,
      currency=excluded.currency,
      fetched_at=excluded.fetched_at,
      ok=excluded.ok,
      error=excluded.error
  `)

  const now = Date.now()

  for (const store of stores) {
    const externalId = mapByStore.get(store.id)
    if (!externalId) continue

    try {
      // Call our fake store APIs via internal fetch
      const url = `${store.api_base}/price?id=${encodeURIComponent(externalId)}`
      const res = await $fetch<{ priceCents: number; currency: string }>(url, {
        headers: event?.node?.req ? { cookie: event.node.req.headers.cookie || '' } : undefined,
      })

      upsert.run({
        product_id: productId,
        store_id: store.id,
        price_cents: res.priceCents,
        currency: res.currency || 'EUR',
        fetched_at: now,
        ok: 1,
        error: null,
      })
    } catch (e: any) {
      // Keep last price_cents if exists; only update ok/error/fetched_at
      const existing = d.prepare('SELECT price_cents, currency FROM prices WHERE product_id = ? AND store_id = ?').get(productId, store.id) as { price_cents: number; currency: string } | undefined
      upsert.run({
        product_id: productId,
        store_id: store.id,
        price_cents: existing?.price_cents ?? 0,
        currency: existing?.currency ?? 'EUR',
        fetched_at: now,
        ok: 0,
        error: String(e?.statusMessage || e?.message || 'Fetch error'),
      })
    }
  }
}

export function shouldRefreshProduct(productId: string, intervalHours: number) {
  const d = db()
  const minFetched = d.prepare(`
    SELECT MIN(fetched_at) AS min_fetched
    FROM prices
    WHERE product_id = ?
  `).get(productId) as { min_fetched: number | null }

  const last = minFetched?.min_fetched ?? null
  if (!last) return true
  const ageMs = Date.now() - last
  return ageMs >= intervalHours * 60 * 60 * 1000
}

