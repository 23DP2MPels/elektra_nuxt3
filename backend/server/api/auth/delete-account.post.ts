import { defineEventHandler, createError } from 'h3'
import { getUserIdFromEvent, getUserById } from '../../utils/auth'
import { mongoDb } from '../../utils/mongo'

export default defineEventHandler(async (event) => {
  const userId = await getUserIdFromEvent(event)
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })

  const user = await getUserById(userId)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'User not found' })

  const mongo = await mongoDb()

  // Delete all saved favorites for this user from favorited_items
  await mongo.collection('favorited_items').deleteMany({ user_id: userId })

  // Delete the user account after favorites are removed
  await mongo.collection('users').deleteOne({ id: userId })

  return { ok: true, message: 'Account deleted successfully' }
})