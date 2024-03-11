export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class DailyQuotaExceededError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DailyQuotaExceededError'
  }
}
