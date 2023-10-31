import * as Hapi from '@hapi/hapi'
import { HOST, PORT, DEFAULT_TIMEOUT_MS, NODE_ENV } from './constants'
import { routes } from './routes'
import { AuthorizationError, ParseError } from 'dci-opencrvs-bridge'
import pino from 'hapi-pino'
import { ValidationError, error } from './error'
import H2o2 from '@hapi/h2o2'

export async function createServer() {
  const server = new Hapi.Server({
    host: HOST,
    port: PORT,
    routes: {
      cors: { origin: ['*'] },
      payload: { maxBytes: 52428800, timeout: DEFAULT_TIMEOUT_MS }
    }
  })

  // H2o2 allows proxying token requests directly to OpenCRVS core auth
  await server.register(H2o2)
  await server.register({
    plugin: pino,
    options: {
      redact: ['req.headers.authorization'],
      ...(NODE_ENV === 'production'
        ? {}
        : {
            transport: {
              target: 'pino-pretty'
            }
          })
    }
  })

  server.route(routes)

  server.ext('onPreResponse', (request, reply) => {
    if (
      request.response instanceof ParseError ||
      request.response instanceof ValidationError
    ) {
      return error(reply, request.response.message, 400)
    }

    if (request.response instanceof AuthorizationError) {
      return error(reply, request.response.message, 401)
    }

    if ('isBoom' in request.response) {
      console.error(request.response)
      return error(reply, 'Internal Server Error', 500)
    }

    return reply.continue
  })

  async function start() {
    await server.start()
    server.log(
      'info',
      `DCI-CRVS to OpenCRVS interoperability API started on ${HOST}:${PORT}`
    )
  }

  async function stop() {
    await server.stop()
    server.log('info', 'Search server stopped')
  }

  async function init() {
    await server.initialize()
    return server
  }

  return { start, init, stop }
}

export interface ReqResWithAuthorization extends Hapi.ReqRefDefaults {
  Headers: { authorization?: string }
}
