import jwt from 'jsonwebtoken'
import { mongoDb } from './mongo'
import { db } from './db'

const COOKIE_NAME = 'session'
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const SESSION_DURATION = 30 * 24 * 60 * 60

type UserDoc = {
  id: string
  email: string
  password_hash: string
  created_at: number
  is_admin?: boolean
}

type SessionDoc = {
  token: string
  user_id: string
  created_at: number
  expires_at: number
}

export function setSessionCookie(event: any, token: string, maxAgeSeconds: number) {
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: maxAgeSeconds,
  })
}

export function clearSessionCookie(event: any) {
  deleteCookie(event, COOKIE_NAME, { path: '/' })
}

export async function createSession(userId: string) {
  const db = await mongoDb()
  const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' })
  const now = Date.now()
  const expires = now + SESSION_DURATION * 1000
  await db.collection<SessionDoc>('sessions').updateOne(
    { token },
    {
      $set: {
        user_id: userId,
        created_at: now,
        expires_at: expires,
      },
    },
    { upsert: true }
  )
  return { token, expiresAt: expires }
}

export async function getUserIdFromEvent(event: any) {
  const token = getCookie(event, COOKIE_NAME)
  if (!token) return null

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string }
    if (!payload.sub) return null

    const db = await mongoDb()
    const session = await db.collection<SessionDoc>('sessions').findOne({ token })
    if (!session) return null
    if (session.expires_at < Date.now()) return null

    await ensureSqliteUserById(session.user_id)
    return session.user_id
  } catch {
    return null
  }
}

export async function ensureSqliteUserById(userId: string) {
  const user = await getUserById(userId)
  if (!user) return

  db().prepare(`
    INSERT OR IGNORE INTO users(id, email, password_hash, created_at, is_admin)
    VALUES (?, ?, ?, ?, ?)
  `).run(user.id, user.email, user.password_hash, user.created_at, user.is_admin ? 1 : 0)
}

export async function getUserByEmail(email: string) {
  const db = await mongoDb()
  return db.collection<UserDoc>('users').findOne({ email })
}

export async function getUserById(userId: string) {
  const db = await mongoDb()
  return db.collection<UserDoc>('users').findOne({ id: userId })
}

export async function createUser(user: UserDoc) {
  const mongo = await mongoDb()
  await mongo.collection<UserDoc>('users').insertOne(user)
  db().prepare(`
    INSERT OR IGNORE INTO users(id, email, password_hash, created_at, is_admin)
    VALUES (?, ?, ?, ?, ?)
  `).run(user.id, user.email, user.password_hash, user.created_at, user.is_admin ? 1 : 0)
}

export async function ensureSqliteUser(user: UserDoc) {
  db().prepare(`
    INSERT OR IGNORE INTO users(id, email, password_hash, created_at, is_admin)
    VALUES (?, ?, ?, ?, ?)
  `).run(user.id, user.email, user.password_hash, user.created_at, user.is_admin ? 1 : 0)
}

export async function deleteSession(token: string) {
  const db = await mongoDb()
  await db.collection<SessionDoc>('sessions').deleteOne({ token })
}

