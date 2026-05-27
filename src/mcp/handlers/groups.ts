import { z } from "zod";
import type { DocmostPort } from "../../core/ports.js";

const ok = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });
const err = (e: unknown) => ({ isError: true as const, content: [{ type: "text" as const, text: String(e) }] });

export const groupHandlers = (client: DocmostPort) => ({
  listGroups: {
    description: "List all groups in the workspace",
    inputSchema: {},
    handler: async () => {
      try { return ok(await client.listGroups()); } catch (e) { return err(e); }
    },
  },

  getGroup: {
    description: "Get details of a specific group",
    inputSchema: { groupId: z.string().describe("Group ID") },
    handler: async ({ groupId }: { groupId: string }) => {
      try { return ok(await client.getGroup(groupId)); } catch (e) { return err(e); }
    },
  },

  createGroup: {
    description: "Create a new group",
    inputSchema: {
      name: z.string().describe("Group name"),
      description: z.string().optional().describe("Group description"),
    },
    handler: async (input: { name: string; description?: string }) => {
      try { return ok(await client.createGroup(input)); } catch (e) { return err(e); }
    },
  },

  updateGroup: {
    description: "Update a group's name or description",
    inputSchema: {
      groupId: z.string().describe("Group ID"),
      name: z.string().optional().describe("New name"),
      description: z.string().optional().describe("New description"),
    },
    handler: async (input: { groupId: string; name?: string; description?: string }) => {
      try { return ok(await client.updateGroup(input)); } catch (e) { return err(e); }
    },
  },

  deleteGroup: {
    description: "Delete a group",
    inputSchema: { groupId: z.string().describe("Group ID to delete") },
    handler: async ({ groupId }: { groupId: string }) => {
      try { await client.deleteGroup(groupId); return ok({ success: true, groupId }); } catch (e) { return err(e); }
    },
  },

  listGroupMembers: {
    description: "List members of a group",
    inputSchema: { groupId: z.string().describe("Group ID") },
    handler: async ({ groupId }: { groupId: string }) => {
      try { return ok(await client.listGroupMembers(groupId)); } catch (e) { return err(e); }
    },
  },

  addGroupMembers: {
    description: "Add users to a group",
    inputSchema: {
      groupId: z.string().describe("Group ID"),
      userIds: z.array(z.string()).describe("User IDs to add"),
    },
    handler: async ({ groupId, userIds }: { groupId: string; userIds: string[] }) => {
      try { await client.addGroupMembers(groupId, userIds); return ok({ success: true }); } catch (e) { return err(e); }
    },
  },

  removeGroupMember: {
    description: "Remove a user from a group",
    inputSchema: {
      groupId: z.string().describe("Group ID"),
      userId: z.string().describe("User ID to remove"),
    },
    handler: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      try { await client.removeGroupMember(groupId, userId); return ok({ success: true }); } catch (e) { return err(e); }
    },
  },
});
