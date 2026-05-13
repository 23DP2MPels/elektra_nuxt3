import { defineEventHandler, createError, readBody } from 'h3'
import bcrypt from 'bcryptjs'
import { getUserIdFromEvent, getUserById } from '../../utils/auth'
import { mongoDb } from '../../utils/mongo'

export default defineEventHandler(async (event) => {
  const userId = await getUserIdFromEvent(event)
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })

  const user = await getUserById(userId)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'User not found' })

  const body = await readBody(event).catch(() => ({}))
  const oldPassword = String(body?.old_password || '')
  const newPassword = String(body?.new_password || '')
  const confirmPassword = String(body?.confirm_password || '')

  // Validate
  if (!oldPassword) {
    throw createError({ statusCode: 400, statusMessage: 'Current password is required' })
  }
  if (!newPassword) {
    throw createError({ statusCode: 400, statusMessage: 'New password is required' })
  }
  if (newPassword.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'New password must be at least 6 characters' })
  }
  if (newPassword !== confirmPassword) {
    throw createError({ statusCode: 400, statusMessage: 'Passwords do not match' })
  }

  // Verify old password
  const ok = await bcrypt.compare(oldPassword, user.password_hash)
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: 'Current password is incorrect' })
  }

  // Hash new password
  const newHash = await bcrypt.hash(newPassword, 10)

  // Update password
  const mongo = await mongoDb()
  await mongo.collection('users').updateOne(
    { id: userId },
    { $set: { password_hash: newHash } }
  )

  return { ok: true, message: 'Password changed successfully' }
})
