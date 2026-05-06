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

  await _db.collection('users').createIndex({ email: 1 }, { unique: true })
  await _db.collection('sessions').createIndex({ token: 1 }, { unique: true })

  return _db
}

export async function mongoDb() {
  return await connectMongo()
}
