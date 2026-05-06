import { createHash } from 'node:crypto'

function hashToInt(input: string) {
  const h = createHash('sha256').update(input).digest()
  // Use first 4 bytes as uint32
  return h.readUInt32BE(0)
}

function dayKey(ms = Date.now()) {
  const d = new Date(ms)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function fakeStorePriceCents(opts: {
  storeId: string
  externalId: string
  currency: 'EUR'
  nowMs?: number
}) {
  const now = opts.nowMs ?? Date.now()
  const base = 5_000 + (hashToInt(`${opts.storeId}:${opts.externalId}`) % 250_000) // 50.00–2550.00 EUR
  const daily = (hashToInt(`${opts.storeId}:${opts.externalId}:${dayKey(now)}`) % 4_000) - 2_000 // -20.00..+20.00
  const storeBias =
    opts.storeId === 'store-a' ? 0 :
      opts.storeId === 'store-b' ? 499 :
        999

  const cents = Math.max(299, base + daily + storeBias)
  return cents
}

