import { createServer } from './server'

createServer().then(async (server) => {
  await server.start()
})

export type * from './crvs-api'
export type * from './validations'
