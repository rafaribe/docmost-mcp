import { z } from "zod";
import type { DocmostPort } from "../../core/ports.js";

const ok = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });
const err = (e: unknown) => ({ isError: true as const, content: [{ type: "text" as const, text: String(e) }] });

export const spaceHandlers = (client: DocmostPort) => ({
  getSpace: {
    description: "Get details of a specific space",
    inputSchema: { spaceId: z.string().describe("Space ID") },
    handler: async ({ spaceId }: { spaceId: string }) => {
      try { return ok(await client.getSpace(spaceId)); } catch (e) { return err(e); }
    },
  },

  listSpaces: {
    description: "List all spaces you have access to",
    inputSchema: {},
    handler: async () => {
      try { return ok(await client.listSpaces()); } catch (e) { return err(e); }
    },
  },

  createSpace: {
    description: "Create a new space",
    inputSchema: {
      name: z.string().describe("Space name"),
      description: z.string().optional().describe("Space description"),
    },
    handler: async (input: { name: string; description?: string }) => {
      try { return ok(await client.createSpace(input)); } catch (e) { return err(e); }
    },
  },

  updateSpace: {
    description: "Update a space's name or description",
    inputSchema: {
      spaceId: z.string().describe("Space ID to update"),
      name: z.string().optional().describe("New name"),
      description: z.string().optional().describe("New description"),
    },
    handler: async (input: { spaceId: string; name?: string; description?: string }) => {
      try { return ok(await client.updateSpace(input)); } catch (e) { return err(e); }
    },
  },

  deleteSpace: {
    description: "Delete a space and all its contents",
    inputSchema: { spaceId: z.string().describe("Space ID to delete") },
    handler: async ({ spaceId }: { spaceId: string }) => {
      try { await client.deleteSpace(spaceId); return ok({ success: true, spaceId }); } catch (e) { return err(e); }
    },
  },

  listSpaceMembers: {
    description: "List members (users and groups) of a space",
    inputSchema: { spaceId: z.string().describe("Space ID") },
    handler: async ({ spaceId }: { spaceId: string }) => {
      try { return ok(await client.listSpaceMembers(spaceId)); } catch (e) { return err(e); }
    },
  },

  addSpaceMembers: {
    description: "Add users or groups to a space",
    inputSchema: {
      spaceId: z.string().describe("Space ID"),
      userIds: z.array(z.string()).optional().describe("User IDs to add"),
      groupIds: z.array(z.string()).optional().describe("Group IDs to add"),
      role: z.string().describe("Role to assign (e.g. writer, reader, admin)"),
    },
    handler: async (input: { spaceId: string; userIds?: string[]; groupIds?: string[]; role: string }) => {
      try { await client.addSpaceMembers(input); return ok({ success: true }); } catch (e) { return err(e); }
    },
  },

  removeSpaceMember: {
    description: "Remove a user or group from a space",
    inputSchema: {
      spaceId: z.string().describe("Space ID"),
      userId: z.string().optional().describe("User ID to remove"),
      groupId: z.string().optional().describe("Group ID to remove"),
    },
    handler: async (input: { spaceId: string; userId?: string; groupId?: string }) => {
      try { await client.removeSpaceMember(input); return ok({ success: true }); } catch (e) { return err(e); }
    },
  },
});
