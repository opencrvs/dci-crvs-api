import { AuthorizationError } from 'opencrvs-api'

export function parseToken(header: string) {
  if (!header.startsWith('Bearer')) {
    throw new AuthorizationError(
      'Authorization header is missing Bearer authentication scheme'
    )
  }

  return header.split('Bearer ')[1]
}
