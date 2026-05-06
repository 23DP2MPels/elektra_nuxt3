import { MongoClient, Db } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mairispelss:ZfRZA4tR3FGMsam1@cluster0.u2bjp7y.mongodb.net/'
const MONGODB_DB = process.env.MONGODB_DB || 'elektra_db'

let _client: MongoClient | null = null
let _db: Db | null = null

async function connectMongo() {
  if (_db) return _db
  if (!_client) {
    _client = new MongoClient(MONGODB_URI)
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
