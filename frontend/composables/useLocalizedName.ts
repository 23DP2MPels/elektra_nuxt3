export function normalizeLocalizedLabel(value: unknown, locale = 'en'): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && !Array.isArray(value)) {
    const labels = value as Record<string, unknown>
    const order = [locale, 'en', 'ru', 'lv', ...Object.keys(labels)]
    for (const key of order) {
      const item = labels[key]
      if (typeof item === 'string' && item.trim()) {
        return item.trim()
      }
    }
  }
  return String(value)
}
