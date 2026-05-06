import { db } from './db'

export function migrate() {
  const d = db()

  d.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category_slug TEXT NOT NULL,
      category_name TEXT NOT NULL,
      subcategory_slug TEXT NOT NULL,
      subcategory_name TEXT NOT NULL,
      image_url TEXT,
      specs_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      api_base TEXT NOT NULL
    );

    -- mapping between our product and store external id
    CREATE TABLE IF NOT EXISTS product_store_map (
      product_id TEXT NOT NULL,
      store_id TEXT NOT NULL,
      external_id TEXT NOT NULL,
      PRIMARY KEY (product_id, store_id),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );

    -- last known prices (cached)
    CREATE TABLE IF NOT EXISTS prices (
      product_id TEXT NOT NULL,
      store_id TEXT NOT NULL,
      price_cents INTEGER NOT NULL,
      currency TEXT NOT NULL,
      fetched_at INTEGER NOT NULL,
      ok INTEGER NOT NULL,
      error TEXT,
      PRIMARY KEY (product_id, store_id),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorites (
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `)

  // Backward-compatible migration: add is_admin if DB was created before.
  const columns = d.prepare(`PRAGMA table_info('users')`).all() as Array<{ name: string }>
  const hasIsAdmin = columns.some(c => c.name === 'is_admin')
  if (!hasIsAdmin) {
    d.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;`)
  }
}

