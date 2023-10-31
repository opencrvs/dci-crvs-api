import type * as Hapi from '@hapi/hapi'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function error(
  res: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>,
  message: string,
  code: number
) {
  return res
    .response({
      error: { code, message }
    })
    .code(code)
}
