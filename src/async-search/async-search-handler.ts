import * as Hapi from "@hapi/hapi";
import { authenticateClient } from "../opencrvs-api";

export async function asyncSearchHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const token = await authenticateClient();

  console.log(token);

  return { message: { ack_status: "ACK" } };
}
