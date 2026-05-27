import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { type Request, type Response } from "express";
import type { DocmostPort } from "../core/ports.js";
import { pageHandlers } from "./handlers/pages.js";
import { spaceHandlers } from "./handlers/spaces.js";
import { commentHandlers } from "./handlers/comments.js";
import { workspaceHandlers } from "./handlers/workspace.js";

export function buildMcpServer(client: DocmostPort): McpServer {
  const server = new McpServer({
    name: "docmost-mcp",
    version: "1.0.0",
  });

  const pages = pageHandlers(client);
  const spaces = spaceHandlers(client);
  const comments = commentHandlers(client);
  const workspace = workspaceHandlers(client);

  // Register all tools
  for (const [name, def] of Object.entries({ ...pages, ...spaces, ...comments, ...workspace })) {
    server.registerTool(name, {
      description: def.description,
      inputSchema: def.inputSchema,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, def.handler as any);
  }

  return server;
}

export function startHttpServer(client: DocmostPort, port: number): void {
  const app = express();
  app.use(express.json());

  // Create a fresh McpServer + transport per request (stateless)
  const handleMcp = async (req: Request, res: Response) => {
    const server = buildMcpServer(client);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  };

  app.post("/mcp", handleMcp);
  app.get("/mcp", handleMcp);
  app.delete("/mcp", handleMcp);

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.listen(port, () => {
    console.log(`docmost-mcp listening on :${port}/mcp`);
  });
}
