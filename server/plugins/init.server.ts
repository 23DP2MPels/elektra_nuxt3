import { seedIfNeeded } from '../utils/seed'

export default defineNitroPlugin(() => {
  seedIfNeeded()
})

