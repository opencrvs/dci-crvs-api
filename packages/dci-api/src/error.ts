import type * as Hapi from "@hapi/hapi";

export function error(
  req: Hapi.Request<Hapi.ReqRefDefaults>,
  res: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>,
  code: number
) {
  return res
    .response({
      error: { code, message: req.response.message },
    })
    .code(code);
}
