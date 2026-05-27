import { DocmostClient } from "./docmost/client.js";
import { buildMcpServer, startHttpServer } from "./mcp/server.js";

const baseUrl = process.env.DOCMOST_BASE_URL;
const apiToken = process.env.DOCMOST_API_TOKEN;
const email = process.env.DOCMOST_EMAIL;
const password = process.env.DOCMOST_PASSWORD;
const port = Number(process.env.PORT ?? 3000);

if (!baseUrl) {
  console.error("Error: DOCMOST_BASE_URL is required.");
  process.exit(1);
}
if (!apiToken && !(email && password)) {
  console.error("Error: provide DOCMOST_API_TOKEN (enterprise) or DOCMOST_EMAIL + DOCMOST_PASSWORD (self-hosted).");
  process.exit(1);
}

const client = new DocmostClient({ baseUrl, apiToken, email, password });
startHttpServer(client, port);
