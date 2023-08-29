export const HOST = process.env.HOST ?? "0.0.0.0";
export const PORT = process.env.PORT ?? 1660;
export const DEFAULT_TIMEOUT_MS = 600000;
export const NODE_ENV = process.env.NODE_ENV;

/** Tests */
export const NO_RESPONSE_MOCK = Boolean(process.env.NO_RESPONSE_MOCK);
