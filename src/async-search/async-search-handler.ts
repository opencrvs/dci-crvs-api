import * as Hapi from "@hapi/hapi";
import { authenticateClient, recordSearch } from "../opencrvs-api";

export async function asyncSearchHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const token = await authenticateClient();
  const result = await recordSearch(token, {
    parameters: { motherFamilyName: "Last" },
  });

  console.log(result.body.hits.hits);

  return { message: { ack_status: "ACK" } };
}
