import { z } from "zod";
import type { DocmostPort } from "../../core/ports.js";

const ok = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });
const err = (e: unknown) => ({ isError: true as const, content: [{ type: "text" as const, text: String(e) }] });

export const commentHandlers = (client: DocmostPort) => ({
  getComments: {
    description: "Get all comments on a page",
    inputSchema: { pageId: z.string().describe("Page ID") },
    handler: async ({ pageId }: { pageId: string }) => {
      try { return ok(await client.getComments(pageId)); } catch (e) { return err(e); }
    },
  },

  createComment: {
    description: "Add a comment to a page",
    inputSchema: {
      pageId: z.string().describe("Page ID to comment on"),
      content: z.string().describe("Comment text"),
      parentCommentId: z.string().optional().describe("Parent comment ID for replies"),
    },
    handler: async (input: { pageId: string; content: string; parentCommentId?: string }) => {
      try { return ok(await client.createComment(input)); } catch (e) { return err(e); }
    },
  },

  updateComment: {
    description: "Update an existing comment",
    inputSchema: {
      commentId: z.string().describe("Comment ID to update"),
      content: z.string().describe("New comment text"),
    },
    handler: async (input: { commentId: string; content: string }) => {
      try { return ok(await client.updateComment(input)); } catch (e) { return err(e); }
    },
  },

  deleteComment: {
    description: "Delete a comment",
    inputSchema: { commentId: z.string().describe("Comment ID to delete") },
    handler: async ({ commentId }: { commentId: string }) => {
      try { await client.deleteComment(commentId); return ok({ success: true, commentId }); } catch (e) { return err(e); }
    },
  },
});
