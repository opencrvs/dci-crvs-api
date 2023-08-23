import * as Hapi from "@hapi/hapi";

export function asyncSearchHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  return { message: { ack_status: "ACK" } };
}
