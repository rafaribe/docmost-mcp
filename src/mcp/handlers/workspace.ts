import { z } from "zod";
import type { DocmostPort } from "../../core/ports.js";

const ok = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });
const err = (e: unknown) => ({ isError: true as const, content: [{ type: "text" as const, text: String(e) }] });

export const workspaceHandlers = (client: DocmostPort) => ({
  getWorkspace: {
    description: "Get information about the current Docmost workspace",
    inputSchema: {},
    handler: async () => {
      try { return ok(await client.getWorkspace()); } catch (e) { return err(e); }
    },
  },

  listWorkspaceMembers: {
    description: "List all members of the workspace",
    inputSchema: {},
    handler: async () => {
      try { return ok(await client.listWorkspaceMembers()); } catch (e) { return err(e); }
    },
  },

  getCurrentUser: {
    description: "Get details of the currently authenticated user",
    inputSchema: {},
    handler: async () => {
      try { return ok(await client.getCurrentUser()); } catch (e) { return err(e); }
    },
  },

  searchAttachments: {
    description: "Search for file attachments across the workspace",
    inputSchema: { query: z.string().describe("Search query") },
    handler: async ({ query }: { query: string }) => {
      try { return ok(await client.searchAttachments(query)); } catch (e) { return err(e); }
    },
  },
});
