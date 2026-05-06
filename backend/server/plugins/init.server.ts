import { seedIfNeeded } from '../utils/seed'

export default defineNitroPlugin(async () => {
  await seedIfNeeded()
})

