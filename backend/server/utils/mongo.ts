import { MongoClient, Db } from 'mongodb'
import 'dotenv/config'

/*console.log('--- ПРОВЕРКА ОКРУЖЕНИЯ ---');
console.log('Текущая папка:', process.cwd());
console.log('MONGODB_URI из env:', process.env.MONGODB_URI);
console.log('MONGODB_DB из env:', process.env.MONGODB_DB);
console.log('--------------------------');
console.log(process.env.MONGODB_URI)*/

const config = useRuntimeConfig()
const MONGODB_URI = config.mongodbUri
const MONGODB_DB = process.env.MONGODB_DB || 'elektra_db'

if (!MONGODB_URI) {
  throw new Error('Please add MONGODB_URI to file .env');
}

let _client: MongoClient | null = null
let _db: Db | null = null

async function connectMongo() {
  if (_db) return _db
  if (!_client) {
    _client = new MongoClient(MONGODB_URI as string)
  }
  await _client.connect()
  _db = _client.db(MONGODB_DB)

  // Users
  await _db.collection('users').createIndex({ email: 1 }, { unique: true })
  await _db.collection('sessions').createIndex({ token: 1 }, { unique: true })

  // Products and stores
  await _db.collection('products').createIndex({ id: 1 }, { unique: true })
  await _db.collection('products').createIndex({ category_slug: 1, subcategory_slug: 1 })
  await _db.collection('stores').createIndex({ id: 1 }, { unique: true })
  await _db.collection('product_store_map').createIndex({ product_id: 1, store_id: 1 }, { unique: true })

  // Prices
  await _db.collection('prices').createIndex({ product_id: 1, store_id: 1 }, { unique: true })
  await _db.collection('prices').createIndex({ fetched_at: 1 })

  // Favorites
  await _db.collection('favorited_items').createIndex({ user_id: 1, product_id: 1 }, { unique: true })

  // Settings
  await _db.collection('setting').createIndex({ key: 1 }, { unique: true })

  return _db
}

export async function mongoDb() {
  return await connectMongo()
}
