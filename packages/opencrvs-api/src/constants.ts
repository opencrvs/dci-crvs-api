/* eslint-disable @typescript-eslint/no-non-null-assertion */
export const OPENCRVS_CLIENT_ID = process.env.OPENCRVS_CLIENT_ID!
export const OPENCRVS_CLIENT_SECRET = process.env.OPENCRVS_CLIENT_SECRET!

const isTest = process.env.NODE_TEST_CONTEXT !== undefined

if (
  !isTest &&
  (OPENCRVS_CLIENT_ID === undefined || OPENCRVS_CLIENT_SECRET === undefined)
) {
  throw new Error(
    'Required environment variables OPENCRVS_CLIENT_ID and OPENCRVS_CLIENT_SECRET are missing. Refer to README.md for more information'
  )
}
/* eslint-enable @typescript-eslint/no-non-null-assertion */

export const OPENCRVS_AUTH_URL =
  process.env.OPENCRVS_AUTH_URL ?? 'http://localhost:4040/'
export const OPENCRVS_GATEWAY_URL =
  process.env.OPENCRVS_GATEWAY_URL ?? 'http://localhost:7070/graphql'
