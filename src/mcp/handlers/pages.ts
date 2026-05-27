import { z } from "zod";
import type { DocmostPort } from "../../core/ports.js";

const ok = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });
const err = (e: unknown) => ({ isError: true as const, content: [{ type: "text" as const, text: String(e) }] });

export const pageHandlers = (client: DocmostPort) => ({
  searchPages: {
    description: "Search for pages by keyword across the workspace",
    inputSchema: {
      query: z.string().describe("Search query"),
      spaceId: z.string().optional().describe("Limit search to a specific space ID"),
    },
    handler: async ({ query, spaceId }: { query: string; spaceId?: string }) => {
      try { return ok(await client.searchPages(query, spaceId)); } catch (e) { return err(e); }
    },
  },

  getPage: {
    description: "Get the full content and metadata of a page. Content is returned as Markdown.",
    inputSchema: { pageId: z.string().describe("Page ID") },
    handler: async ({ pageId }: { pageId: string }) => {
      try { return ok(await client.getPage(pageId)); } catch (e) { return err(e); }
    },
  },

  listPages: {
    description: "List recent pages in a space, ordered by last updated",
    inputSchema: { spaceId: z.string().optional().describe("Space ID to filter by") },
    handler: async ({ spaceId }: { spaceId?: string }) => {
      try { return ok(await client.listPages(spaceId)); } catch (e) { return err(e); }
    },
  },

  listChildPages: {
    description: "List direct child pages of a specific page",
    inputSchema: { pageId: z.string().describe("Parent page ID") },
    handler: async ({ pageId }: { pageId: string }) => {
      try { return ok(await client.listChildPages(pageId)); } catch (e) { return err(e); }
    },
  },

  createPage: {
    description: "Create a new page with Markdown content. Optionally nest under a parent page.",
    inputSchema: {
      title: z.string().describe("Page title"),
      content: z.string().optional().describe("Markdown content"),
      spaceId: z.string().describe("Space ID to create the page in"),
      parentPageId: z.string().optional().describe("Parent page ID to nest under"),
    },
    handler: async (input: { title: string; content?: string; spaceId: string; parentPageId?: string }) => {
      try { return ok(await client.createPage(input)); } catch (e) { return err(e); }
    },
  },

  updatePage: {
    description: "Update a page's title and/or content",
    inputSchema: {
      pageId: z.string().describe("Page ID to update"),
      title: z.string().optional().describe("New title"),
      content: z.string().optional().describe("New Markdown content"),
    },
    handler: async (input: { pageId: string; title?: string; content?: string }) => {
      try { return ok(await client.updatePage(input)); } catch (e) { return err(e); }
    },
  },

  movePage: {
    description: "Move a page to a different parent or to the root of a space",
    inputSchema: {
      pageId: z.string().describe("Page ID to move"),
      parentPageId: z.string().nullable().optional().describe("New parent page ID, or null to move to root"),
      position: z.string().optional().describe("Position string (default: end of list)"),
    },
    handler: async (input: { pageId: string; parentPageId?: string | null; position?: string }) => {
      try { await client.movePage(input); return ok({ success: true }); } catch (e) { return err(e); }
    },
  },

  movePageToSpace: {
    description: "Move a page to a different space",
    inputSchema: {
      pageId: z.string().describe("Page ID to move"),
      targetSpaceId: z.string().describe("Target space ID"),
    },
    handler: async ({ pageId, targetSpaceId }: { pageId: string; targetSpaceId: string }) => {
      try { return ok(await client.movePageToSpace(pageId, targetSpaceId)); } catch (e) { return err(e); }
    },
  },

  duplicatePage: {
    description: "Duplicate a page within its current space",
    inputSchema: { pageId: z.string().describe("Page ID to duplicate") },
    handler: async ({ pageId }: { pageId: string }) => {
      try { return ok(await client.duplicatePage(pageId)); } catch (e) { return err(e); }
    },
  },

  copyPageToSpace: {
    description: "Copy a page to a different space",
    inputSchema: {
      pageId: z.string().describe("Page ID to copy"),
      targetSpaceId: z.string().describe("Target space ID"),
    },
    handler: async ({ pageId, targetSpaceId }: { pageId: string; targetSpaceId: string }) => {
      try { return ok(await client.copyPageToSpace(pageId, targetSpaceId)); } catch (e) { return err(e); }
    },
  },

  deletePage: {
    description: "Move a page to trash (soft delete)",
    inputSchema: { pageId: z.string().describe("Page ID to delete") },
    handler: async ({ pageId }: { pageId: string }) => {
      try { await client.deletePage(pageId); return ok({ success: true, pageId }); } catch (e) { return err(e); }
    },
  },

  restorePage: {
    description: "Restore a page from trash",
    inputSchema: { pageId: z.string().describe("Page ID to restore") },
    handler: async ({ pageId }: { pageId: string }) => {
      try { return ok(await client.restorePage(pageId)); } catch (e) { return err(e); }
    },
  },

  listTrash: {
    description: "List deleted pages in a space's trash",
    inputSchema: { spaceId: z.string().describe("Space ID") },
    handler: async ({ spaceId }: { spaceId: string }) => {
      try { return ok(await client.listTrash(spaceId)); } catch (e) { return err(e); }
    },
  },

  getPageHistory: {
    description: "Get the version history of a page",
    inputSchema: { pageId: z.string().describe("Page ID") },
    handler: async ({ pageId }: { pageId: string }) => {
      try { return ok(await client.getPageHistory(pageId)); } catch (e) { return err(e); }
    },
  },

  getPageLabels: {
    description: "Get labels attached to a page",
    inputSchema: { pageId: z.string().describe("Page ID") },
    handler: async ({ pageId }: { pageId: string }) => {
      try { return ok(await client.getPageLabels(pageId)); } catch (e) { return err(e); }
    },
  },

  addPageLabels: {
    description: "Add labels to a page by name (creates labels if they don't exist)",
    inputSchema: {
      pageId: z.string().describe("Page ID"),
      names: z.array(z.string()).describe("Label names to add"),
    },
    handler: async ({ pageId, names }: { pageId: string; names: string[] }) => {
      try { await client.addPageLabels(pageId, names); return ok({ success: true }); } catch (e) { return err(e); }
    },
  },

  removePageLabel: {
    description: "Remove a label from a page",
    inputSchema: {
      pageId: z.string().describe("Page ID"),
      labelId: z.string().describe("Label ID to remove"),
    },
    handler: async ({ pageId, labelId }: { pageId: string; labelId: string }) => {
      try { await client.removePageLabel(pageId, labelId); return ok({ success: true }); } catch (e) { return err(e); }
    },
  },

  getBacklinks: {
    description: "Get pages that link to this page (incoming backlinks)",
    inputSchema: { pageId: z.string().describe("Page ID") },
    handler: async ({ pageId }: { pageId: string }) => {
      try { return ok(await client.getBacklinks(pageId)); } catch (e) { return err(e); }
    },
  },
});
